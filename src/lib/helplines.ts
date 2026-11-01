import helplinesData from "../data/helplines.json";

export type HelplineItem = {
	id?: string;
	title?: string;
	name: string;
	contact?: string;
	note?: string;
	url?: string;
	linkLabel?: string;
};

export const FEATURED_HELPLINES: HelplineItem[] = helplinesData;

export const GLOBAL_FALLBACK_HELPLINE: HelplineItem = helplinesData[0];
