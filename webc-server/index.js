#!/usr/bin/env node --watch

import { createServer } from "node:http";
import { WebC } from "@11ty/webc";

async function main() {
	// Create the layout component, used to combine the page with CSS & JS
	// This does not bundle
	const layout = new WebC();
	layout.setInputPath("layout.webc");
	layout.defineComponents("components/*.webc");

	// Create the page component, to handle requests
	const page = new WebC();
	page.setInputPath("page.webc");
	page.defineComponents("components/*.webc");
	page.setBundlerMode(true);

	const http = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, `http://${request.headers.host}`);

			// Render the page, passing in the request
			const p = await page.compile({ data: { url, request } });

			// Render the layout with the page and request objects
			const l = await layout.compile({
				data: {
					url,
					page: p,
					request,
				},
			});

			// Complete the request by sending back HTML
			response.setHeader("content-type", "text/html");
			response.end(l.html);
		} catch (error) {
			console.error("Request failed", error);
			response.statusCode = 500;
			response.end("Internal server error");
		}
	});

	await new Promise((resolve) => http.listen(3000, resolve));
	console.log("Listening on http://localhost:3000");
}

main().catch((e) => console.error("Fatal error", e));
