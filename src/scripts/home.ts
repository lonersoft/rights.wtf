/**
 * Homepage behaviour. Kept out of Home.astro so the component stays markup.
 *
 * Reads the build-time jurisdiction JSON embedded by the page and renders the
 * quick-sheet. Status presentation comes from lib/status, the same module the
 * server uses, so the first paint and the hydrated state cannot disagree.
 */
import { COVERAGE, STATUS_STYLE, coverageBadgeClass, type TopicStatus } from "../lib/status";
import type { Coverage } from "../lib/jurisdictions";

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

// 4. Client-side Geo IP Country Detection
async function detectCountry() {
	const targetEl = document.getElementById("user-geo-country");
	if (!targetEl) return;

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

	if (code) {
		let countryName = code;
		try {
			const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
			countryName = displayNames.of(code) || code;
		} catch {}
		const regionSuffix = regionName ? ` · ${regionName}` : "";
		targetEl.innerHTML = `<span class="text-ink font-bold">${countryName}${regionSuffix}</span>`;
		return;
	}

	targetEl.textContent = "Worldwide (location unavailable)";
}

detectCountry();
