/**
 * GitHub App client for rights.wtf contributions.
 *
 * Authenticates as a GitHub App using RS256 WebCrypto JWT signing, exchanges
 * for an installation access token, creates a dedicated branch, commits the
 * single jurisdiction JSON file, and opens a pull request.
 *
 * Never commits to `main`. Every submission is gated on human review and CI.
 */
import { CANONICAL_BY_CODE } from "./iso";
import { TOPIC_LABELS } from "./jurisdictions";
import {
	type Submission,
	type JurisdictionData,
	type TopicKey,
	topicKeys,
} from "./schema";

export type GitHubEnv = {
	GITHUB_APP_ID?: string;
	GITHUB_APP_INSTALLATION_ID?: string;
	GITHUB_APP_PRIVATE_KEY?: string;
	GITHUB_REPO_OWNER?: string;
	GITHUB_REPO_NAME?: string;
};

function base64url(input: string | Uint8Array): string {
	const b64 =
		typeof input === "string"
			? Buffer.from(input, "utf8").toString("base64")
			: Buffer.from(input).toString("base64");
	return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Sign an RS256 JWT using WebCrypto.
 * Works across Cloudflare Workers and Node 20+.
 */
async function signAppJwt(appId: string, privateKeyPem: string): Promise<string> {
	// Strip PEM headers and all whitespace
	const cleanKey = privateKeyPem
		.replace(/-----BEGIN[A-Z0-9 ]*PRIVATE KEY-----/g, "")
		.replace(/-----END[A-Z0-9 ]*PRIVATE KEY-----/g, "")
		.replace(/\s+/g, "");

	const keyBuffer = Buffer.from(cleanKey, "base64");

	const privateKey = await crypto.subtle.importKey(
		"pkcs8",
		keyBuffer,
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
		false,
		["sign"],
	);

	const now = Math.floor(Date.now() / 1000);
	const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const payload = base64url(
		JSON.stringify({
			iat: now - 60, // 60s clock drift leeway
			exp: now + 540, // 9 minutes validity (GitHub max is 10)
			iss: appId.trim(),
		}),
	);

	const data = new TextEncoder().encode(`${header}.${payload}`);
	const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, data);
	const sigBase64 = base64url(new Uint8Array(signature));

	return `${header}.${payload}.${sigBase64}`;
}

// In-memory token cache to avoid re-authenticating on rapid submissions
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getInstallationToken(env: GitHubEnv): Promise<string> {
	const appId = env.GITHUB_APP_ID;
	const installationId = env.GITHUB_APP_INSTALLATION_ID;
	const privateKey = env.GITHUB_APP_PRIVATE_KEY;

	if (!appId || !installationId || !privateKey) {
		throw new Error(
			"Missing GitHub App secrets. Required: GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY",
		);
	}

	const now = Date.now();
	if (cachedToken && cachedToken.expiresAt > now + 60_000) {
		return cachedToken.token;
	}

	const jwt = await signAppJwt(appId, privateKey);

	const res = await fetch(
		`https://api.github.com/app/installations/${installationId.trim()}/access_tokens`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "rights-wtf-bot",
			},
		},
	);

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`GitHub token exchange failed (${res.status}): ${errText}`);
	}

	const data = (await res.json()) as { token: string; expires_at: string };
	cachedToken = {
		token: data.token,
		expiresAt: new Date(data.expires_at).getTime(),
	};

	return data.token;
}

export type PrResult = {
	prUrl: string;
	prNumber: number;
	branch: string;
};

export async function openContributionPr(
	submission: Submission,
	env: GitHubEnv,
): Promise<PrResult> {
	const canonical = CANONICAL_BY_CODE.get(submission.code);
	if (!canonical) {
		throw new Error(`Unknown jurisdiction code: ${submission.code}`);
	}

	const owner = env.GITHUB_REPO_OWNER ?? "lonersoft";
	const repo = env.GITHUB_REPO_NAME ?? "rights.wtf";
	const token = await getInstallationToken(env);

	const headers = {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
		"User-Agent": "rights-wtf-bot",
	};

	// 1. Get default branch commit SHA
	const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
		headers,
	});
	if (!refRes.ok) {
		throw new Error(`Failed to get main ref (${refRes.status}): ${await refRes.text()}`);
	}
	const refData = (await refRes.json()) as { object: { sha: string } };
	const mainSha = refData.object.sha;

	// 2. Fetch current file from main (to compute accurate diff and preserve existing fields)
	const filePath = `src/content/jurisdictions/${submission.code}.json`;
	const contentRes = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=main`,
		{ headers },
	);

	let existingData: JurisdictionData | null = null;
	let existingSha: string | undefined;

	if (contentRes.ok) {
		const contentJson = (await contentRes.json()) as { content: string; sha: string };
		existingSha = contentJson.sha;
		try {
			const decoded = Buffer.from(contentJson.content, "base64").toString("utf8");
			existingData = JSON.parse(decoded) as JurisdictionData;
		} catch {}
	}

	// 3. Create a unique branch
	const branchName = `contribute/${submission.code}-${Date.now().toString(36)}`;
	const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({
			ref: `refs/heads/${branchName}`,
			sha: mainSha,
		}),
	});

	if (!createRefRes.ok) {
		throw new Error(`Failed to create branch (${createRefRes.status}): ${await createRefRes.text()}`);
	}

	// 4. Construct updated jurisdiction record
	const today = new Date().toISOString().slice(0, 10);
	const isCurrentlyVerified = existingData?.verification === "verified";

	const topicsRecord: Record<string, unknown> = {};
	const statusChanges: { key: TopicKey; oldStatus: string; newStatus: string; downgraded: boolean }[] = [];

	const SEVERITY_ORDER: Record<string, number> = {
		protected: 4,
		partial: 3,
		restricted: 2,
		criminalized: 1,
		unknown: 0,
	};

	for (const key of topicKeys) {
		const submittedTopic = submission.topics[key];
		const existingTopic = existingData?.topics[key];

		const oldStatus = existingTopic?.status ?? "unknown";
		const newStatus = submittedTopic.status;

		const isDowngrade =
			oldStatus !== "unknown" &&
			newStatus !== "unknown" &&
			SEVERITY_ORDER[newStatus] < SEVERITY_ORDER[oldStatus];

		if (oldStatus !== newStatus) {
			statusChanges.push({ key, oldStatus, newStatus, downgraded: isDowngrade });
		}

		// Keep verifiedAt only if content did not change
		const unchanged =
			existingTopic &&
			existingTopic.status === submittedTopic.status &&
			existingTopic.summary === submittedTopic.summary &&
			existingTopic.since === submittedTopic.since &&
			existingTopic.sources.length === submittedTopic.sources.length;

		topicsRecord[key] = {
			status: submittedTopic.status,
			summary: submittedTopic.summary,
			since: submittedTopic.since,
			sources: submittedTopic.sources,
			verifiedAt: unchanged ? existingTopic?.verifiedAt : undefined,
		};
	}

	const newRecord: JurisdictionData = {
		code: submission.code,
		name: existingData?.name ?? canonical.name,
		parent: existingData?.parent ?? canonical.parent,
		region: existingData?.region,
		verification: isCurrentlyVerified ? "verified" : "submitted",
		updatedAt: today,
		helplines: existingData?.helplines ?? [],
		topics: topicsRecord as unknown as JurisdictionData["topics"],
	};

	// 5. Commit file to branch
	const fileContent = JSON.stringify(newRecord, null, "\t") + "\n";
	const commitRes = await fetch(
		`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
		{
			method: "PUT",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				message: `contribute(${submission.code}): update ${canonical.name} legal rights info`,
				content: Buffer.from(fileContent, "utf8").toString("base64"),
				branch: branchName,
				sha: existingSha,
			}),
		},
	);

	if (!commitRes.ok) {
		throw new Error(`Failed to commit file (${commitRes.status}): ${await commitRes.text()}`);
	}

	// 6. Generate PR description
	const creditDisplay = submission.credit
		? `@${submission.credit.replace(/^@/, "")} (claimed, unverified)`
		: "anonymous";

	let prBody = `## Contribution: ${canonical.name} (\`${submission.code}\`)\n\n`;
	prBody += `**Submitted by:** ${creditDisplay}\n`;
	prBody += `**Target verification tier:** \`${newRecord.verification}\`\n\n`;

	if (isCurrentlyVerified) {
		prBody += `> [!WARNING]\n`;
		prBody += `> **This PR modifies a VERIFIED jurisdiction.**\n`;
		prBody += `> The \`verified\` tier was preserved, but every changed claim below must be manually re-checked against primary law before merging.\n\n`;
	}

	const hasDowngrade = statusChanges.some((c) => c.downgraded);
	if (hasDowngrade) {
		prBody += `> [!CAUTION]\n`;
		prBody += `> **Safety warning: one or more legal statuses was moved to a less protective tier.**\n`;
		prBody += `> Check sources carefully before merging.\n\n`;
	}

	prBody += `### Status diff\n\n`;
	prBody += `| Topic | Previous | Submitted | Severity |\n`;
	prBody += `|---|---|---|---|\n`;

	for (const key of topicKeys) {
		const change = statusChanges.find((c) => c.key === key);
		const submitted = submission.topics[key];
		const oldSt = existingData?.topics[key]?.status ?? "unknown";
		const newSt = submitted.status;

		const marker = change
			? change.downgraded
				? "⚠️ downgraded"
				: "changed"
			: "unchanged";

		prBody += `| ${TOPIC_LABELS[key]} | \`${oldSt}\` | \`${newSt}\` | ${marker} |\n`;
	}

	prBody += `\n### Sources cited\n\n`;
	let sourceCount = 0;
	for (const key of topicKeys) {
		const t = submission.topics[key];
		if (t.sources.length > 0) {
			prBody += `- **${TOPIC_LABELS[key]}**:\n`;
			for (const s of t.sources) {
				sourceCount++;
				prBody += `  - [${s.label}](${s.url}) (\`${s.kind}\`)\n`;
			}
		}
	}
	if (sourceCount === 0) {
		prBody += `_No sources cited (all topics unknown)._\n`;
	}

	prBody += `\n---\n*Opened by rights.wtf contribution bot from https://rights.wtf/contribute/${submission.code}*`;

	// 7. Open Pull Request
	const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({
			title: `contribute(${submission.code}): update ${canonical.name}`,
			head: branchName,
			base: "main",
			body: prBody,
		}),
	});

	if (!prRes.ok) {
		throw new Error(`Failed to open PR (${prRes.status}): ${await prRes.text()}`);
	}

	const prData = (await prRes.json()) as { html_url: string; number: number };
	return {
		prUrl: prData.html_url,
		prNumber: prData.number,
		branch: branchName,
	};
}
