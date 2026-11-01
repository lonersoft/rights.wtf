export const prerender = false;

import type { APIRoute } from "astro";
import { openContributionPr, type GitHubEnv } from "../../lib/github";
import { checkRateLimit, verifyTurnstile } from "../../lib/ratelimit";
import { normalizeSubmission, submissionSchema, type Submission } from "../../lib/schema";

type CombinedEnv = GitHubEnv & {
	RATE_LIMIT?: any;
	TURNSTILE_SECRET_KEY?: string;
};

async function getRuntimeEnv(): Promise<CombinedEnv> {
	try {
		const cf = await import("cloudflare:workers");
		if (cf?.env) return cf.env as CombinedEnv;
	} catch {}

	return (process.env || {}) as CombinedEnv;
}

export const POST: APIRoute = async ({ request }) => {
	// 1. Guard payload size (64 KB cap)
	const contentLength = Number(request.headers.get("content-length") || "0");
	if (contentLength > 65536) {
		return new Response(JSON.stringify({ error: "Payload too large (max 64 KB)" }), {
			status: 413,
			headers: { "Content-Type": "application/json" },
		});
	}

	let rawBody: unknown;
	try {
		rawBody = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// 2. Validate payload strictly
	const normalized = normalizeSubmission(rawBody as Submission);
	const parseResult = submissionSchema.safeParse(normalized);

	if (!parseResult.success) {
		const messages = parseResult.error.issues.map((i) => i.message);
		return new Response(
			JSON.stringify({
				error: messages.join("; "),
				issues: parseResult.error.issues,
			}),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const submission = parseResult.data;
	const clientIp = request.headers.get("cf-connecting-ip") || "127.0.0.1";
	const env = await getRuntimeEnv();

	// 3. Enforce rate limits
	const rateCheck = await checkRateLimit(clientIp, env);
	if (!rateCheck.ok) {
		return new Response(JSON.stringify({ error: rateCheck.error ?? "Rate limit exceeded" }), {
			status: 429,
			headers: { "Content-Type": "application/json" },
		});
	}

	// 4. Verify bot token (if Turnstile secret is configured)
	const turnstileCheck = await verifyTurnstile(submission.turnstileToken, clientIp, env.TURNSTILE_SECRET_KEY);
	if (!turnstileCheck.ok) {
		return new Response(JSON.stringify({ error: turnstileCheck.error ?? "Bot check failed" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}

	// 5. Open PR via GitHub App
	try {
		const result = await openContributionPr(submission, env);

		return new Response(
			JSON.stringify({
				ok: true,
				prUrl: result.prUrl,
				prNumber: result.prNumber,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal server error";
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
