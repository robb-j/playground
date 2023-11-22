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

watchColorScheme((newScheme) => {
	map.setStyle(getMapStyle(layers, newScheme));
});

let tool;
setTool(location.hash);
window.addEventListener("hashchange", (e) => setTool(location.hash));

function setTool(hash = "") {
	tool = hash && hash.replace(/^#/, "");
	for (const anchor of document.querySelectorAll(".menu a")) {
		if (anchor.href.endsWith(hash)) {
			anchor.setAttribute("aria-current", "true");
			anchor.blur();
			document.querySelector("h1").textContent = anchor.textContent;
		} else {
			anchor.removeAttribute("aria-current");
		}
	}
}
