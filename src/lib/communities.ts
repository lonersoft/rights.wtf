import communitiesData from "../data/communities.json";

export type CommunityScope = "global" | "country";

export type CommunityItem = {
	id?: string;
	title?: string;
	name: string;
	note?: string;
	url?: string;
	linkLabel?: string;
	/** "global" is always shown; "country" is filtered by detected location. */
	scope?: CommunityScope;
	/** ISO 3166-1 alpha-2 country codes this community covers, e.g. ["fr"]. */
	countries?: string[];
	/** Optional sub-national region names, e.g. ["Île-de-France"]. */
	regions?: string[];
};

export const COMMUNITIES = communitiesData as CommunityItem[];

export const WORLDWIDE_COMMUNITIES = COMMUNITIES.filter(
	(c) => !c.scope || c.scope === "global",
);
