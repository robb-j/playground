// Generate a light/dark theme style
export function getMapStyle(layers, theme = "light") {
	return {
		version: 8,
		glyphs:
			"https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
		sources: {
			protomaps: {
				type: "vector",
				url: "pmtiles://https://tiles.openlab.dev/ncl.pmtiles",
			},
		},
		layers: layers("protomaps", theme),
	};
}

/** @param {(colorScheme: 'dark' | 'light') => void} callback */
export function watchColorScheme(callback) {
	if (typeof window.matchMedia !== "function") return;

	const media = window.matchMedia("(prefers-color-scheme: dark)");
	callback(media.matches ? "dark" : "light");

	media.addEventListener("change", (e) => {
		callback(e.matches ? "dark" : "light");
	});
}
