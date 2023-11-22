import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";
import { getMapStyle, watchColorScheme } from "../pmtiles/tools.mjs";

// Configure maplibre to use pmtiles
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const map = new maplibregl.Map({
	container: "map", // container id
	center: [-1.615008, 54.971191], // starting position [lng, lat]
	zoom: 13, // starting zoom
	style: getMapStyle(layers, "light"),
	maxBounds: [-2.072468, 54.730692, -1.112537, 55.248329],
});

let colorScheme;
watchColorScheme((newScheme) => {
	colorScheme = newScheme;
	if (theme.value !== "system") return;
	map.setStyle(getMapStyle(layers, newScheme));
});

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
