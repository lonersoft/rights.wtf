#!/usr/bin/env node
/**
 * Scaffold a schema-valid jurisdiction file.
 *
 * Usage:
 *   node scripts/new-jurisdiction.mjs <iso-code> [--force]
 *
 * Example:
 *   node scripts/new-jurisdiction.mjs ie
 */
import fs from "node:fs";
import path from "node:path";

const code = process.argv[2]?.toLowerCase();
const force = process.argv.includes("--force");

if (!code || !/^[a-z]{2}(-[a-z0-9]{1,3})?$/.test(code)) {
	console.error("Usage: node scripts/new-jurisdiction.mjs <code > [--force]");
	console.error("Example: node scripts/new-jurisdiction.mjs ie");
	process.exit(1);
}

const targetPath = path.resolve(process.cwd(), `src/content/jurisdictions/${code}.json`);
if (fs.existsSync(targetPath) && !force) {
	console.error(`Error: ${targetPath} already exists. Pass --force to overwrite.`);
	process.exit(1);
}

// Read canonical list from src/lib/iso.ts
const isoPath = path.resolve(process.cwd(), "src/lib/iso.ts");
const isoContent = fs.readFileSync(isoPath, "utf8");

// Simple regex extraction for code in COUNTRY_PAIRS / SUBDIVISIONS
const pairMatch = isoContent.match(new RegExp(`\\["${code}",\\s*"([^"]+)"\\]`));
const name = pairMatch ? pairMatch[1] : code.toUpperCase();

const parentMatch = isoContent.match(new RegExp(`\\{\\s*code:\\s*"${code}",\\s*name:\\s*"[^"]*",\\s*parent:\\s*"([^"]*)"`));
const parent = parentMatch ? parentMatch[1] : null;

const today = new Date().toISOString().slice(0, 10);

const stub = {
	code,
	name,
	parent,
	verification: "imported",
	updatedAt: today,
	helplines: [],
	topics: {
		decriminalization: {
			status: "unknown",
			summary: "",
			sources: [],
		},
		marriage: {
			status: "unknown",
			summary: "",
			sources: [],
		},
		genderRecognition: {
			status: "unknown",
			summary: "",
			sources: [],
		},
		conversionTherapy: {
			status: "unknown",
			summary: "",
			sources: [],
		},
		asylum: {
			status: "unknown",
			summary: "",
			sources: [],
		},
	},
};

fs.writeFileSync(targetPath, JSON.stringify(stub, null, "\t") + "\n", "utf8");
console.log(`✓ Scaffolded ${code}.json (${name}) at src/content/jurisdictions/${code}.json`);
