/**
 * Shared client-side location detection and country/region filtering.
 *
 * Used by the homepage helplines section and the /helplines page so both
 * surfaces make the same decision about what counts as a local match.
 */

export type Location = {
	country: string | null;
	region: string;
};

/** Best-effort country + region lookup. Never throws; returns null country on failure. */
export async function detectLocation(): Promise<Location> {
	let code = "";
	let regionName = "";

	try {
		const res = await fetch("https://ipinfo.io/json");
		if (res.ok) {
			const data = (await res.json()) as { country?: string; region?: string; city?: string };
			if (data.country) {
				code = data.country;
				if (data.region && data.region !== data.city) {
					regionName = data.region;
				}
			}
		}
	} catch {}

	if (!code) {
		try {
			const res = await fetch("https://api.country.is");
			if (res.ok) {
				const data = (await res.json()) as { country?: string };
				if (data.country) code = data.country;
			}
		} catch {}
	}

	if (!code) {
		try {
			const res = await fetch("/api/geo.json");
			if (res.ok) {
				const json = (await res.json()) as { country?: string };
				if (json.country && json.country !== "XX") code = json.country;
			}
		} catch {}
	}

	return { country: code || null, region: regionName };
}

export function countryLabel(code: string): string {
	try {
		return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code.toUpperCase();
	} catch {
		return code.toUpperCase();
	}
}

export function normaliseRegion(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

/**
 * Toggle country-scoped cards inside `list` based on the detected location.
 * Global cards are left untouched so callers can decide their fallback rule.
 */
export function filterCountryCards(
	list: HTMLElement | null,
	location: Location,
): { hasLocal: boolean } {
	if (!list) return { hasLocal: false };

	const country = location.country?.toLowerCase() ?? "";
	const region = normaliseRegion(location.region);
	let hasLocal = false;

	for (const card of list.querySelectorAll<HTMLElement>('[data-scope="country"]')) {
		const countries = (card.dataset.countries ?? "")
			.split(",")
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean);
		const regions = (card.dataset.regions ?? "")
			.split(",")
			.map(normaliseRegion)
			.filter(Boolean);

		const matchesCountry = country !== "" && countries.includes(country);
		const matchesRegion = region !== "" && regions.includes(region);
		const show = matchesCountry || matchesRegion;

		card.hidden = !show;
		if (show) hasLocal = true;
	}

	return { hasLocal };
}
