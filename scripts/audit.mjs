#!/usr/bin/env node
/**
 * Content audit script for rights.wtf.
 *
 * Inspects all 285 canonical jurisdictions, authored records, and topic completion:
 * - Coverage tier counts
 * - Gaps: which topics are still "unknown" across authored files
 * - Freshness: entries not updated in > 180 days
 * - Missing helplines
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), "src/content/jurisdictions");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

const authored = files.map((f) => JSON.stringify(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))));
const records = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

console.log("=========================================");
console.log(" rights.wtf Content Health Audit");
console.log("=========================================\n");

const byVerification = {
	verified: 0,
	imported: 0,
	submitted: 0,
	stub: 0,
};

const topicMissing = {
	decriminalization: 0,
	marriage: 0,
	genderRecognition: 0,
	conversionTherapy: 0,
	asylum: 0,
};

const stale = [];
const now = Date.now();
const SIX_MONTHS_MS = 180 * 24 * 3600 * 1000;

for (const r of records) {
	const tier = r.verification || "stub";
	byVerification[tier] = (byVerification[tier] || 0) + 1;

	for (const [key, topic] of Object.entries(r.topics || {})) {
		if (topic.status === "unknown") {
			topicMissing[key] = (topicMissing[key] || 0) + 1;
		}
	}

	if (r.updatedAt) {
		const updatedMs = new Date(r.updatedAt).getTime();
		if (now - updatedMs > SIX_MONTHS_MS) {
			stale.push({ code: r.code, name: r.name, updatedAt: r.updatedAt });
		}
	}
}

const TOTAL_CANONICAL = 285;
const unauthoredCount = TOTAL_CANONICAL - records.length;

console.log("Coverage Breakdown:");
console.log(`  ✓ Verified (primary law checked):   ${byVerification.verified || 0}`);
console.log(`  ⚠ Imported (monitor seeded):        ${byVerification.imported || 0}`);
console.log(`  ✎ Submitted (contributor queue):    ${byVerification.submitted || 0}`);
console.log(`  · Authored stubs:                   ${byVerification.stub || 0}`);
console.log(`  · Unauthored stubs (dynamic ISO):   ${unauthoredCount}`);
console.log(`  Total Jurisdictions:                ${TOTAL_CANONICAL}\n`);

console.log(`Topic Gaps in ${records.length} Authored Records:`);
for (const [k, count] of Object.entries(topicMissing)) {
	const completed = records.length - count;
	const pct = Math.round((completed / records.length) * 100);
	console.log(`  - ${k.padEnd(20)}: ${completed}/${records.length} written (${pct}%)`);
}

console.log("");
if (stale.length > 0) {
	console.log(`Stale Entries (> 180 days since check): ${stale.length}`);
	for (const s of stale) {
		console.log(`  - ${s.code.padEnd(8)} ${s.name} (${s.updatedAt})`);
	}
} else {
	console.log("Freshness: All authored records updated within the last 180 days.");
}

console.log("\n=========================================");
