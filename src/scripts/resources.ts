import { countryLabel, detectLocation, filterCountryCards, type Location } from "./geo";

function locationText(location: Location): string {
	if (!location.country) return "Worldwide (location unavailable)";
	const region = location.region ? ` · ${location.region}` : "";
	return `${countryLabel(location.country)}${region}`;
}

function warningText(kind: "helpline" | "community", location: Location): string {
	if (!location.country) {
		return kind === "helpline"
			? "we couldn't detect your location, so only the worldwide services above are shown."
			: "we couldn't detect your location, so only the global communities below are shown.";
	}

	const name = countryLabel(location.country);
	return kind === "helpline"
		? `no local helpline listed for ${name} yet. the worldwide services above still work anywhere.`
		: `no communities listed for ${name} yet. the global groups below are a good place to start.`;
}

function setWarning(
	el: HTMLElement | null,
	kind: "helpline" | "community",
	location: Location,
	hasLocal: boolean,
) {
	if (!el) return;
	if (hasLocal) {
		el.classList.add("hidden");
		el.textContent = "";
		return;
	}
	el.textContent = warningText(kind, location);
	el.classList.remove("hidden");
}

async function init() {
	const label = document.getElementById("resources-geo-label");
	const location = await detectLocation();
	if (label) label.textContent = locationText(location);

	const helplines = document.getElementById("country-helplines-list");
	const { hasLocal: hasHelplines } = filterCountryCards(helplines, location);
	setWarning(
		document.getElementById("country-helplines-warning"),
		"helpline",
		location,
		hasHelplines,
	);

	const communities = document.getElementById("communities-list");
	const { hasLocal: hasCommunities } = filterCountryCards(communities, location);
	setWarning(
		document.getElementById("communities-warning"),
		"community",
		location,
		hasCommunities,
	);
}

init();
