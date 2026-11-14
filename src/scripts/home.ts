/**
 * Homepage behaviour. Kept out of Home.astro so the component stays markup.
 *
 * Reads the build-time jurisdiction JSON embedded by the page and renders the
 * quick-sheet. Status presentation comes from lib/status, the same module the
 * server uses, so the first paint and the hydrated state cannot disagree.
 */
import { COVERAGE, STATUS_STYLE, coverageBadgeClass, type TopicStatus } from "../lib/status";
import type { Coverage } from "../lib/jurisdictions";
import { countryLabel, detectLocation, filterCountryCards, type Location } from "./geo";

type Preview = {
	code: string;
	name: string;
	coverage: Coverage;
	topics: { key: string; status: TopicStatus; summary: string }[];
};

// 1. Country preview, driven by build-time content collections.
const dataEl = document.getElementById("jurisdiction-data");
const previews: Preview[] = dataEl?.textContent ? JSON.parse(dataEl.textContent) : [];
const byCode = new Map(previews.map((p) => [p.code, p]));

function renderPreview(code: string) {
	const p = byCode.get(code);
	const nameEl = document.getElementById("info-country-name");
	const badgeEl = document.getElementById("info-status-badge");
	const rowsEl = document.getElementById("info-rows");
	const linkEl = document.getElementById("info-full-link") as HTMLAnchorElement | null;
	if (!p || !nameEl || !badgeEl || !rowsEl || !linkEl) return;

	nameEl.textContent = p.name;
	badgeEl.textContent = COVERAGE[p.coverage].short;
	badgeEl.className = coverageBadgeClass(p.coverage);

	rowsEl.replaceChildren();
	for (const t of p.topics) {
		const style = STATUS_STYLE[t.status] ?? STATUS_STYLE.unknown;
		const row = document.createElement("div");
		row.className = "flex items-start gap-1.5";
		const icon = document.createElement("span");
		icon.className = `${style.text} font-bold`;
		icon.setAttribute("aria-hidden", "true");
		icon.textContent = style.mark;
		const text = document.createElement("span");
		text.textContent = t.status === "unknown" ? "not verified yet" : t.summary;
		row.appendChild(icon);
		row.appendChild(text);
		rowsEl.appendChild(row);
	}

	linkEl.href = `/country/${p.code}`;
}

const selector = document.getElementById("country-selector") as HTMLSelectElement | null;
if (selector) {
	selector.addEventListener("change", () => renderPreview(selector.value));
	renderPreview(selector.value);
}

// 2. Quick Exit: Escape 3 times opens Google immediately
let escHits = 0;
let escTimer: ReturnType<typeof setTimeout> | null = null;

window.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		escHits++;
		if (escTimer) clearTimeout(escTimer);
		if (escHits >= 3) {
			window.location.replace("https://www.google.com");
			return;
		}
		escTimer = setTimeout(() => {
			escHits = 0;
		}, 1500);
	}
});

// 3. Mobile <details> menu: close on link click and on outside click
const mobileMenu = document.querySelector("header details");

if (mobileMenu) {
	mobileMenu.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => {
			mobileMenu.removeAttribute("open");
		});
	});

	document.addEventListener("click", (e) => {
		if (mobileMenu.hasAttribute("open") && !mobileMenu.contains(e.target as Node)) {
			mobileMenu.removeAttribute("open");
		}
	});
}

// 4. Helplines: show entries that match the detected country or region.
// Country entries start hidden in the markup; global entries are the fallback
// used only when no location is detected or no local helpline exists.
const helplineList = document.getElementById("helpline-list");
const helplineWarning = document.getElementById("helpline-warning");
const helplineWarningCountry = document.getElementById("helpline-warning-country");

function renderHelplines(location: Location) {
	if (!helplineList) return;

	const { hasLocal } = filterCountryCards(helplineList, location);

	// Global entries only appear as a fallback.
	for (const card of helplineList.querySelectorAll<HTMLElement>(
		'[data-scope]:not([data-scope="country"])',
	)) {
		card.hidden = hasLocal;
	}

	if (!helplineWarning) return;

	const showWarning = location.country !== null && !hasLocal;
	helplineWarning.classList.toggle("hidden", !showWarning);

	if (showWarning && helplineWarningCountry && location.country) {
		helplineWarningCountry.textContent = countryLabel(location.country);
	}
}

// 5. Client-side Geo IP Country Detection
async function detectCountry() {
	const targetEl = document.getElementById("user-geo-country");
	if (!targetEl) return;

	const location = await detectLocation();

	if (location.country) {
		const regionSuffix = location.region ? ` · ${location.region}` : "";
		targetEl.innerHTML = `<span class="text-ink font-bold">${countryLabel(location.country)}${regionSuffix}</span>`;
	} else {
		targetEl.textContent = "Worldwide (location is unavailable)";
	}

	renderHelplines(location);
}

detectCountry();
