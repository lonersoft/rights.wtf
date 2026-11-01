import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
	<defs>
		<radialGradient id="wash" cx="50%" cy="0%" r="80%">
			<stop offset="0%" stop-color="#be185d" stop-opacity="0.22" />
			<stop offset="100%" stop-color="#14100f" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- Background -->
	<rect width="1200" height="630" fill="#14100f" />
	<rect width="1200" height="630" fill="url(#wash)" />

	<!-- Top brand mark -->
	<g transform="translate(100, 110)">
		<rect width="140" height="42" rx="21" fill="#be185d" />
		<text x="70" y="27" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" text-anchor="middle" letter-spacing="-0.02em">rights.wtf</text>
	</g>

	<!-- Main Title -->
	<text x="100" y="280" fill="#f5f5f4" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" letter-spacing="-0.03em">
		no but actually,
	</text>
	<text x="100" y="365" fill="#f43f5e" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" letter-spacing="-0.03em">
		what are rights?
	</text>

	<!-- Subtitle -->
	<text x="100" y="440" fill="#a8a29e" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400" letter-spacing="-0.01em">
		A plain-language queer legal rights field guide across 285 jurisdictions.
	</text>

	<!-- Bottom metadata rule -->
	<line x1="100" y1="510" x2="1100" y2="510" stroke="#292524" stroke-width="1" />
	<text x="100" y="550" fill="#78716c" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500">
		Sourced primary law · Verified helplines · Community-contributed
	</text>
</svg>`;

	return new Response(svg, {
		headers: {
			"Content-Type": "image/svg+xml",
			"Cache-Control": "public, max-age=86400, immutable",
		},
	});
};
