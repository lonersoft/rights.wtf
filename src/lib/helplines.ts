import helplinesData from "../data/helplines.json";

export type HelplineScope = "global" | "country";

export type HelplineItem = {
	id?: string;
	title?: string;
	name: string;
	contact?: string;
	note?: string;
	url?: string;
	linkLabel?: string;
	/** "global" is always shown; "country" is filtered by detected location. */
	scope?: HelplineScope;
	/** ISO 3166-1 alpha-2 country codes this helpline covers, e.g. ["us"]. */
	countries?: string[];
	/** Optional sub-national region names, e.g. ["California", "Scotland"]. */
	regions?: string[];
};

export const FEATURED_HELPLINES = helplinesData as HelplineItem[];

export const WORLDWIDE_HELPLINES = FEATURED_HELPLINES.filter(
	(h) => !h.scope || h.scope === "global",
);

export const GLOBAL_FALLBACK_HELPLINE = WORLDWIDE_HELPLINES[0] ?? FEATURED_HELPLINES[0];
