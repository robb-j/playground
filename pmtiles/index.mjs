import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";

const url = new URL(location.href);

/** @type {HTMLSelectElement} */
const theme = document.getElementById("themePicker");
theme.value = url.searchParams.get("theme") ?? "system";

// Configure maplibre to use pmtiles
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Generate a light/dark theme style
function createStyle(theme = "light") {
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

const map = new maplibregl.Map({
	container: "map", // container id
	center: [-1.615008, 54.971191], // starting position [lng, lat]
	zoom: 13, // starting zoom
	style: getThemeStyle(theme.value),
	maxBounds: [-2.072468, 54.730692, -1.112537, 55.248329],
});

function getThemeStyle(theme) {
	if (theme === "system") {
		const isDark = window.matchMedia("(prefers-color-scheme: dark)");
		return createStyle(isDark.matches ? "dark" : "light");
	} else {
		return createStyle(theme);
	}
}

theme.addEventListener("input", () => {
	console.debug("theme", theme.value);

	map.setStyle(getThemeStyle(theme.value));

	const url = new URL(location.href);
	url.searchParams.set("theme", theme.value);
	history.pushState(null, null, url);
});

// Dynamic light/dark mode
if (window.matchMedia) {
	const isDark = window.matchMedia("(prefers-color-scheme: dark)");
	if (isDark.matches && theme.value === "system") {
		map.setStyle(createStyle("dark"));
	}
	isDark.addEventListener("change", (e) => {
		console.debug("color-schema changed isDark=%o", e.matches);
		if (theme.value === "system") {
			map.setStyle(createStyle(e.matches ? "dark" : "light"));
		}
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
