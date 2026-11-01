/**
 * Rate limiting and Turnstile bot protection for the submission pipeline.
 *
 * Enforces:
 * 1. Cloudflare Turnstile token validation (if secret is configured).
 * 2. Per-IP hourly submission limit (default: 5 / hour).
 * 3. Global hourly submission limit (default: 30 / hour).
 *
 * Operates across Cloudflare KV (if bound) with in-memory fallback.
 */

type RateLimitEnv = {
	RATE_LIMIT?: {
		get(key: string): Promise<string | null>;
		put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
	};
	TURNSTILE_SECRET_KEY?: string;
};

// In-memory sliding window for isolates / local dev without KV
const memoryBucket = new Map<string, { count: number; resetAt: number }>();

function checkMemoryLimit(key: string, max: number, windowMs = 3600_000): { ok: boolean; remaining: number } {
	const now = Date.now();
	const entry = memoryBucket.get(key);

	if (!entry || entry.resetAt <= now) {
		memoryBucket.set(key, { count: 1, resetAt: now + windowMs });
		return { ok: true, remaining: max - 1 };
	}

	if (entry.count >= max) {
		return { ok: false, remaining: 0 };
	}

	entry.count++;
	return { ok: true, remaining: max - entry.count };
}

export async function checkRateLimit(
	ip: string,
	env: RateLimitEnv,
): Promise<{ ok: boolean; error?: string }> {
	const hourKey = new Date().toISOString().slice(0, 13); // e.g. "2026-11-01T22"
	const ipKey = `rate:ip:${ip.replace(/[^a-zA-Z0-9:.-]/g, "")}:${hourKey}`;
	const globalKey = `rate:global:${hourKey}`;

	const MAX_PER_IP = 5;
	const MAX_GLOBAL = 30;

	// 1. If KV binding is available, use it
	if (env.RATE_LIMIT) {
		try {
			const [ipCountStr, globalCountStr] = await Promise.all([
				env.RATE_LIMIT.get(ipKey),
				env.RATE_LIMIT.get(globalKey),
			]);

			const ipCount = Number(ipCountStr || "0");
			const globalCount = Number(globalCountStr || "0");

			if (globalCount >= MAX_GLOBAL) {
				return { ok: false, error: "Global hourly submission limit reached. Please try again later." };
			}

			if (ipCount >= MAX_PER_IP) {
				return { ok: false, error: "Too many submissions from this connection. Please try again in an hour." };
			}

			await Promise.all([
				env.RATE_LIMIT.put(ipKey, String(ipCount + 1), { expirationTtl: 7200 }),
				env.RATE_LIMIT.put(globalKey, String(globalCount + 1), { expirationTtl: 7200 }),
			]);

			return { ok: true };
		} catch {}
	}

	// 2. In-memory fallback
	const globalCheck = checkMemoryLimit(globalKey, MAX_GLOBAL);
	if (!globalCheck.ok) {
		return { ok: false, error: "Global hourly submission limit reached. Please try again later." };
	}

	const ipCheck = checkMemoryLimit(ipKey, MAX_PER_IP);
	if (!ipCheck.ok) {
		return { ok: false, error: "Too many submissions from this connection. Please try again in an hour." };
	}

	return { ok: true };
}

export async function verifyTurnstile(
	token: string | undefined,
	ip: string,
	secretKey: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
	// If secret is not configured in env, bypass gracefully (allows local dev & tests)
	if (!secretKey) return { ok: true };

	if (!token) {
		return { ok: false, error: "Missing Turnstile verification token." };
	}

	try {
		const form = new URLSearchParams();
		form.append("secret", secretKey);
		form.append("response", token);
		if (ip && ip !== "127.0.0.1") form.append("remoteip", ip);

		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: form.toString(),
		});

		const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
		if (!data.success) {
			return { ok: false, error: "Bot verification failed. Please try again." };
		}

		return { ok: true };
	} catch {
		return { ok: false, error: "Failed to connect to verification service." };
	}
}
