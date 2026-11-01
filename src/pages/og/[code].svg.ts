import type { APIRoute } from "astro";
import { getAllJurisdictions, type ResolvedJurisdiction } from "../../lib/jurisdictions";
import { COVERAGE } from "../../lib/status";

export async function getStaticPaths() {
	const all = await getAllJurisdictions();
	return all.map((j) => ({ params: { code: j.code }, props: { j } }));
}

interface Props {
	j: ResolvedJurisdiction;
}

export const GET: APIRoute = async ({ props }) => {
	const { j } = props as Props;
	const cov = COVERAGE[j.coverage];

	// Tone colors for SVG tag
	const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
		ok: { bg: "#064e3b", text: "#6ee7b7", border: "#047857" },
		warn: { bg: "#78350f", text: "#fde68a", border: "#b45309" },
		accent: { bg: "#831843", text: "#fbcfe8", border: "#be185d" },
		info: { bg: "#1e3a8a", text: "#bfdbfe", border: "#2563eb" },
		neutral: { bg: "#262626", text: "#a3a3a3", border: "#525252" },
	};

	const badge = BADGE_COLORS[cov.tone] || BADGE_COLORS.neutral;

	// Escape XML entities
	const escapeXml = (s: string) =>
		s
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");

	const nameEscaped = escapeXml(j.name);
	const badgeText = escapeXml(cov.label.toUpperCase());

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<radialGradient id="wash" cx="50%" cy="0%" r="80%">
			<stop offset="0%" stop-color="#be185d" stop-opacity="0.18" />
			<stop offset="100%" stop-color="#14100f" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- Background -->
	<rect width="1200" height="630" fill="#14100f" />
	<rect width="1200" height="630" fill="url(#wash)" />

	<!-- Top brand mark -->
	<g transform="translate(100, 100)">
		<rect width="120" height="38" rx="19" fill="#be185d" />
		<text x="60" y="24" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" text-anchor="middle" letter-spacing="-0.02em">rights.wtf</text>
	</g>

	<!-- Status Badge -->
	<g transform="translate(100, 180)">
		<rect width="280" height="34" rx="17" fill="${badge.bg}" stroke="${badge.border}" stroke-width="1.5" />
		<text x="140" y="22" fill="${badge.text}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="0.05em">${badgeText}</text>
	</g>

	<!-- Jurisdiction Title -->
	<text x="100" y="320" fill="#f5f5f4" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" letter-spacing="-0.03em">
		${nameEscaped}
	</text>

	<!-- Subtitle -->
	<text x="100" y="400" fill="#a8a29e" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400" letter-spacing="-0.01em">
		Plain-language legal realities and resources for queer people.
	</text>

	<!-- Bottom metadata rule -->
	<line x1="100" y1="510" x2="1100" y2="510" stroke="#292524" stroke-width="1" />
	<text x="100" y="550" fill="#78716c" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500">
		Every claim backed by primary legal sources · Free, non-profit field guide
	</text>
</svg>`;

	return new Response(svg, {
		headers: {
			"Content-Type": "image/svg+xml",
			"Cache-Control": "public, max-age=86400, immutable",
		},
	});
};
