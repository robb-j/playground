import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";

import {
	getMapStyle,
	watchColorScheme,
	disposeSymbol,
} from "../pmtiles/tools.mjs";

const template = document.createElement("template");
template.innerHTML = `
	<frame-layout>
		<div class="mapInteraction-map"></div>
	</frame-layout>
	<div class="mapInteraction-status"></div>
	<div class="mapInteraction-toolbar">
		<!-- ... -->
	</div>
`;

const style = new CSSStyleSheet();
style.replaceSync(`
	.mapInteraction-map {
		width: 100%;
		height: 100%;
		border-radius: 0.5em 0.5em 0 0;
		overflow: hidden;
	}
`);

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

export class MapInteraction extends HTMLElement {
	static addedStyles = false;

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
		return this.querySelector("frame-layout");
	}
	get mapElem() {
		return this.querySelector(".mapInteraction-map");
	}
	get statusElem() {
		return this.querySelector(".mapInteraction-status");
	}
	get toolbarElem() {
		return this.querySelector(".mapInteraction-toolbar");
	}

	constructor() {
		super();

		this.appendChild(template.content.cloneNode(true));
		this.pmtiles = new pmtiles.Protocol();
		this.map = new maplibregl.Map({
			container: this.mapElem,
			style: getMapStyle(layers, this.theme),
			center: [this.lng, this.lat],
			zoom: this.zoom,
			maxBounds: this.bounds,
		});

		if (!MapInteraction.addedStyles) {
			document.adoptedStyleSheets.push(style);
			MapInteraction.addedStyles = true;
		}

		// this.toggleMapInteractivity(false);
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
				bounds
			);
		}

		// this.frameElem.setAttribute("ratio", this.ratio);
		// this.map.setMaxBounds(this.bounds);
		// this.map.setStyle(getMapStyle(layers, this.theme));

		// this.map.setZoom(this.zoom);
		// this.map.setCenter([this.lng, this.lat]);
	}

	toggleMapInteractivity(interactive) {
		const action = interactive ? "enable" : "disable";
		this.map.scrollZoom[action]();
		this.map.boxZoom[action]();
		this.map.dragRotate[action]();
		this.map.dragPan[action]();
		this.map.keyboard[action]();
		this.map.doubleClickZoom[action]();
		this.map.touchZoomRotate[action]();
	}
}
