#!/usr/bin/env node
/**
 * Verify that sources cited across all jurisdictions are still live.
 *
 * Every non-unknown claim requires a receipt. If a URL returns 404 or 410,
 * the claim is unsupported and the build should flag it.
 *
 * Fails (exit 1) on hard broken links (404, 410).
 * Warns on timeouts or 403 (many legal gazettes use aggressive bot blocks).
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), "src/content/jurisdictions");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

const sources = [];

for (const file of files) {
	const code = path.basename(file, ".json");
	const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
	if (!data.topics) continue;

	for (const [topicKey, topic] of Object.entries(data.topics)) {
		if (!Array.isArray(topic.sources)) continue;
		for (const s of topic.sources) {
			if (s.url) {
				sources.push({
					code,
					topic: topicKey,
					label: s.label,
					url: s.url,
				});
			}
		}
	}
}

console.log(`Checking ${sources.length} sources across ${files.length} jurisdictions…\n`);

// Deduplicate URLs to avoid hammering the same host
const byUrl = new Map();
for (const s of sources) {
	if (!byUrl.has(s.url)) byUrl.set(s.url, []);
	byUrl.get(s.url).push(s);
}

const userAgent = "Mozilla/5.0 (compatible; rights-wtf-source-checker/1.0; +https://rights.wtf)";

async function checkUrl(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);

	try {
		// Try HEAD first
		let res = await fetch(url, {
			method: "HEAD",
			headers: { "User-Agent": userAgent },
			signal: controller.signal,
			redirect: "follow",
		});

		// Fallback to GET if method not allowed
		if (res.status === 405) {
			res = await fetch(url, {
				method: "GET",
				headers: { "User-Agent": userAgent },
				signal: controller.signal,
				redirect: "follow",
			});
		}

		clearTimeout(timeout);
		return { url, status: res.status, ok: res.ok };
	} catch (err) {
		clearTimeout(timeout);
		return { url, status: 0, error: err.name === "AbortError" ? "timeout (10s)" : err.message };
	}
}

// Concurrency pool (max 8 in-flight)
const results = [];
const urls = [...byUrl.keys()];
const CONCURRENCY = 8;
let cursor = 0;

async function worker() {
	while (cursor < urls.length) {
		const idx = cursor++;
		const u = urls[idx];
		const res = await checkUrl(u);
		results.push(res);
	}
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

let failed = 0;
let warned = 0;

for (const r of results) {
	const entries = byUrl.get(r.url) || [];
	const locs = entries.map((e) => `${e.code}:${e.topic}`).join(", ");

	if (r.status === 404 || r.status === 410) {
		failed++;
		console.error(`✗ [${r.status}] ${r.url}`);
		console.error(`  cited by: ${locs}`);
	} else if (r.status === 403 || r.status === 429 || r.status === 0) {
		warned++;
		console.warn(`! [${r.status || r.error}] ${r.url}`);
		console.warn(`  cited by: ${locs}`);
	} else if (r.ok) {
		console.log(`✓ [${r.status}] ${r.url}`);
	} else {
		console.warn(`? [${r.status}] ${r.url}`);
	}
}

console.log(`\nResults: ${results.length} unique URLs checked.`);
console.log(`- ${results.length - failed - warned} ok`);
console.log(`- ${warned} warnings (bot-protection / timeout)`);
console.log(`- ${failed} broken (404/410)`);

if (failed > 0) {
	console.error(`\nFound ${failed} broken citation(s). Every claim requires a valid source.`);
	process.exit(1);
}
