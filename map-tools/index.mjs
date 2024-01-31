import * as pmtiles from "pmtiles";
// import * as turf from "@turf/turf";
import maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";
import { getMapStyle, watchColorScheme } from "../pmtiles/tools.mjs";
// import { MapToolbarElement } from "./map-toolbar.mjs";

import { MapInteraction } from "./map-interaction.mjs";
import { MapToolbar } from "./map-toolbar.mjs";
import { NavigateTool } from "./navigate-tool.mjs";

// Configure maplibre to use pmtiles
// const protocol = new pmtiles.Protocol();
// maplibregl.addProtocol("pmtiles", protocol.tile);

// const map = new maplibregl.Map({
// 	container: "map",
// 	center: [-1.615008, 54.971191],
// 	zoom: 13,
// 	style: getMapStyle(layers, "light"),
// 	maxBounds: [-2.072468, 54.730692, -1.112537, 55.248329],
// });

// setInteractive(false);

// function setInteractive(interactive) {
// 	const action = interactive ? "enable" : "disable";
// 	map.scrollZoom[action]();
// 	map.boxZoom[action]();
// 	map.dragRotate[action]();
// 	map.dragPan[action]();
// 	map.keyboard[action]();
// 	map.doubleClickZoom[action]();
// 	map.touchZoomRotate[action]();
// }

MapToolbar.define();
MapInteraction.define();
const map = MapInteraction.query("#map");
map.toolbar.addTool(new NavigateTool());

// MapToolbarElement.define();
// const toolbar = MapToolbarElement.query("map-toolbar");
// toolbar.addTool({
// 	id: "navigate",
// 	name: "Navigate",
// 	color: "#4E9B61",
// 	onSelect() {
// 		map.getContainer().style.cursor = "grab";
// 		setInteractive(true);
// 	},
// 	onDeselect() {
// 		setInteractive(false);
// 	},
// });
// toolbar.addTool({
// 	id: "shade",
// 	name: "Shade",
// 	color: "#4e5c9b",
// 	onSelect() {
// 		map.getContainer().style.cursor = "crosshair";
// 	},
// 	onDeselect() {},
// });

// // Add control to show browser's location (if allowed)
// const geolocate = new maplibregl.GeolocateControl({
// 	positionOptions: { enableHighAccuracy: true },
// 	trackUserLocation: true,
// });
// map.addControl(geolocate);
//
// // Add buttons to zoom in and out
// const nav = new maplibregl.NavigationControl();
// map.addControl(nav, "top-left");
//
// watchColorScheme((newScheme) => {
// 	map.setStyle(getMapStyle(layers, newScheme));
// });

// let tool;
// setTool(location.hash);
// window.addEventListener("hashchange", (e) => setTool(location.hash));
//
// function setTool(hash = "") {
// 	tool = hash && hash.replace(/^#/, "");
// 	if (!tool) return;
// 	for (const anchor of document.querySelectorAll(".menu a")) {
// 		if (anchor.href.endsWith(hash)) {
// 			anchor.setAttribute("aria-current", "true");
// 			anchor.blur();
// 			document.querySelector("h1").textContent = anchor.textContent;
// 		} else {
// 			anchor.removeAttribute("aria-current");
// 		}
// 	}
// }
