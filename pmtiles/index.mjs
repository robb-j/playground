import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";

// Configure maplibre to use pmtiles
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Generate a light/dark theme style
function getStyle(theme = "light") {
	return {
		version: 8,
		glyphs:
			"https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
		sources: {
			protomaps: {
				type: "vector",
				url: "pmtiles://https://dl.openlab.dev/tiles/ncl.pmtiles",
			},
		},
		layers: layers("protomaps", theme),
	};
}

const map = new maplibregl.Map({
	container: "map", // container id
	// style: "https://demotiles.maplibre.org/style.json", // style URL
	center: [-1.615008, 54.971191], // starting position [lng, lat]
	zoom: 13, // starting zoom
	style: getStyle("light"),
	maxBounds: [-2.072468, 54.730692, -1.112537, 55.248329],
});

// Dynamic light/dark mode
if (window.matchMedia) {
	const isDark = window.matchMedia("(prefers-color-scheme: dark)");
	if (isDark.matches) {
		map.setStyle(getStyle("dark"));
	}
	isDark.addEventListener("change", (e) => {
		console.debug("color-schema changed isDark=%o", e.matches);
		map.setStyle(getStyle(e.matches ? "dark" : "light"));
	});
}

// Add control to show browser's location (if allowed)
let geolocate = new maplibregl.GeolocateControl({
	positionOptions: {
		enableHighAccuracy: true,
	},
	trackUserLocation: true,
});
map.addControl(geolocate);

// Add buttons to zoom in and out
let nav = new maplibregl.NavigationControl();
map.addControl(nav, "top-left");
