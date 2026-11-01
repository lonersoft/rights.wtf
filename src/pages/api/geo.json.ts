export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
	const country = request.headers.get("cf-ipcountry") || "XX";
	return new Response(JSON.stringify({ country }), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "private, no-cache, no-store",
		},
	});
};
