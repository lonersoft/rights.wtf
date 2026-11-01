import { getCollection } from "astro:content";
import { CANONICAL, CANONICAL_BY_CODE } from "./iso";
import type { JurisdictionData } from "./schema";

export type Jurisdiction = JurisdictionData;

export type Coverage = "verified" | "imported" | "submitted" | "partial" | "stub";

export type ResolvedJurisdiction = {
	code: string;
	name: string;
	parent: string | null;
	coverage: Coverage;
	authored: Jurisdiction | null;
};

/** A jurisdiction counts as "covered" if any topic makes a real claim. */
export function knownTopicCount(j: Jurisdiction): number {
	return Object.values(j.topics).filter((t) => t.status !== "unknown").length;
}

export function coverageOf(j: Jurisdiction): Coverage {
	const known = knownTopicCount(j);
	if (j.verification === "verified") return "verified";
	if (known === 0) return "stub";
	if (j.verification === "imported") return "imported";
	if (j.verification === "submitted") return "submitted";
	return "partial";
}

/**
 * Merge authored content with the canonical list so every jurisdiction has a
 * page. Authored entries win; everything else is a stub.
 */
export async function getAllJurisdictions(): Promise<ResolvedJurisdiction[]> {
	const entries = await getCollection("jurisdictions");
	const authored = new Map(entries.map((e) => [e.data.code, e.data]));

	const codes = new Set<string>([...CANONICAL.map((j) => j.code), ...authored.keys()]);

	return [...codes]
		.map((code) => {
			const a = authored.get(code) ?? null;
			const canonical = CANONICAL_BY_CODE.get(code);
			return {
				code,
				name: a?.name ?? canonical?.name ?? code.toUpperCase(),
				parent: a?.parent ?? canonical?.parent ?? null,
				coverage: a ? coverageOf(a) : ("stub" as Coverage),
				authored: a,
			};
		})
		.sort((x, y) => x.name.localeCompare(y.name));
}

export async function getJurisdiction(code: string): Promise<ResolvedJurisdiction | null> {
	const all = await getAllJurisdictions();
	return all.find((j) => j.code === code) ?? null;
}

export const TOPIC_LABELS: Record<keyof Jurisdiction["topics"], string> = {
	decriminalization: "decriminalization",
	marriage: "marriage & partnership",
	genderRecognition: "legal gender recognition",
	conversionTherapy: "conversion practices",
	asylum: "asylum & refuge",
};


