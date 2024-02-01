import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";

import {
	getMapStyle,
	watchColorScheme,
	disposeSymbol,
	alembicStyles,
} from "../pmtiles/tools.mjs";

const template = document.createElement("template");
template.innerHTML = `
	${alembicStyles}
	<frame-layout class="frame">
		<div class="map"></div>
	</frame-layout>
	<div class="status"></div>
	<map-toolbar class="toolbar"></map-toolbar>
`;

const style = new CSSStyleSheet();
style.replaceSync(`
	.map {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	/* From alembic but not available in shadow root */
	frame-layout {
		aspect-ratio: 16 / 9;
		overflow: hidden;
		display: flex;
		justify-content: center;
		align-items: center;
	}
`);

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

export class MapInteraction extends HTMLElement {
	static get observedAttributes() {
		return ["ratio", "lat", "lng", "zoom", "bounds"];
	}

	static define() {
		customElements.define("map-interaction", this);
	}

	/** @returns {MapInteraction} */
	static query(selector) {
		return document.querySelector(selector);
	}

	get ratio() {
		return this.getAttribute("ratio") ?? "16:9";
	}
	get lat() {
		return parseFloat(this.getAttribute("lat") ?? "-1.615008");
	}
	get lng() {
		return parseFloat(this.getAttribute("lng") ?? "54.971191");
	}
	get zoom() {
		return parseFloat(this.getAttribute("zoom") ?? "13");
	}
	get theme() {
		return this.getAttribute("theme") ?? "light";
	}
	get bounds() {
		return (this.getAttribute("bounds") ?? "0 0 0 0")
			.split(/[, ]+/)
			.map((str) => parseFloat(str))
			.slice(0, 4);
	}

	get frameElem() {
		return this.shadowRoot.querySelector(".frame");
	}
	get mapElem() {
		return this.shadowRoot.querySelector(".map");
	}
	get statusElem() {
		return this.shadowRoot.querySelector(".status");
	}
	/** @type {import("./map-toolbar.mjs").MapToolbar} */
	get toolbar() {
		return this.shadowRoot.querySelector(".toolbar");
	}

	constructor() {
		super();

		const root = this.attachShadow({ mode: "open" });
		root.appendChild(template.content.cloneNode(true));
		root.adoptedStyleSheets.push(style);

		this.pmtiles = new pmtiles.Protocol();
		this.map = new maplibregl.Map({
			container: this.mapElem,
			style: getMapStyle(layers, this.theme),
			center: [this.lng, this.lat],
			zoom: this.zoom,
			maxBounds: this.bounds,
			attributionControl: false,
		});

		this.toolbar.map = this.map;

		this.toolbar.addEventListener("maptoolchange", (event) =>
			this.onToolChange(event.tool),
		);
		this.toolbar.addEventListener("mapcontrolchange", (event) =>
			this.onControlChange(event.control),
		);
	}

	connectedCallback() {
		this.render();

		// Only process it if "scheme" is "system" ???
		this.colorSchemeListener = watchColorScheme((newScheme) => {
			this.map.setStyle(getMapStyle(layers, newScheme));
		});
	}

	disconnectedCallback() {
		this.colorSchemeListener?.[disposeSymbol]();
		this.colorSchemeListener = undefined;
	}

	attributeChangedCallback() {
		this.render();
	}

	render() {
		const bounds = this.bounds;
		if (bounds.some((n) => Number.isNaN(n))) {
			console.warn(
				"<map-interaction> `bounds` must be four floating point numbers.",
				bounds,
			);
		}

		// this.frameElem.setAttribute("ratio", this.ratio);
		// this.map.setMaxBounds(this.bounds);
		// this.map.setStyle(getMapStyle(layers, this.theme));

		// this.map.setZoom(this.zoom);
		// this.map.setCenter([this.lng, this.lat]);

		this.map.resize();
	}

	/** @param {import("./map-toolbar.mjs").MapTool} tool */
	onToolChange(tool) {
		console.log("onToolChange", tool);
	}

	/** @param {import("./map-toolbar.mjs").MapControl} control */
	onControlChange(control) {
		console.log("onControlChange", control);
	}
}
