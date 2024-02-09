import { circle, union, difference, simplify } from "@turf/turf";
import { NewActionEvent } from "./actions.mjs";

/** @typedef {import("maplibre-gl").Map} LibreMap */
/** @typedef {import("maplibre-gl").MapMouseEvent} LibreMouseEvent */
/** @typedef {import("maplibre-gl").MapTouchEvent} LibreTouchEvent */

/*
	geodata could be a FeatureCollection instead.
	The first could be the live document and the second the "diff".
	Starting a draw would add to the "diff" feature
	then finishing would "commit" it to the live document and add to the action stack.
	
	There could also be "transactions" on or adjacent to the ActionStack to start something
	with the ability to "rollback" to cancel it or to "commit" it to finish and add to the ActionStack.
	
	It should show the brush on hover of the document when you aren't drawing.
*/

const DEFAULT_MIN_BRUSH = 50;
const DEFAULT_MAX_BRUSH = 500;
const DEFAULT_BRUSH_SIZE = 200;

const details = document.createElement("template");
details.innerHTML = `
	<cluster-layout space="var(--s-3)" class="wrapper">
		<button id="shade" aria-current="true" disabled>SHADE</button>
		<button id="erase">ERASE</button>
		<label class="field">
			<span class="field-label">Radius</span>
			<input type="range" id="radius">
		</label>
	</cluster-layout>
`;

function emptyFeature() {
	return {
		type: "Feature",
		geometry: {
			type: "MultiPolygon",
			coordinates: [],
		},
	};
}

/**
	@typedef {object} ShadeToolOptions
	@property {number | undefined} min
	@property {number | undefined} max
	@property {number | undefined} brush
	@property {string | undefined} name
*/

export class ShadeTool extends EventTarget {
	static source = "shade-tool";

	/** @type {LibreMap | null} */ map = null;
	radius = 200;
	mode = "shade";

	/** @param {ShadeToolOptions} options */
	constructor(options = {}) {
		super();
		this.id = "shade";
		this.name = options.name ?? "Shade Tool";

		this.brush = {
			min: options.min ?? DEFAULT_MIN_BRUSH,
			max: options.max ?? DEFAULT_MAX_BRUSH,
			size: options.brush ?? DEFAULT_BRUSH_SIZE,
			mode: "shade",
		};

		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseOut = this.onMouseOut.bind(this);

		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.onTouchCancel = this.onTouchCancel.bind(this);

		this.isShading = false;
		this.geodata = emptyFeature();
		this.bubbleDaddy = null;

		this.map = null;
	}

	/** @param {Event} event */
	dispatchEvent(event) {
		// console.log(event);
		const shouldContinue = super.dispatchEvent(event);

		if (event.bubbles && shouldContinue) {
			this.bubbleDaddy?.dispatchEvent(event);
		}
	}

	/** @param {LibreMap} map */
	onAdd(map) {
		console.log("ShadeTool#onAdd");

		map.addSource(ShadeTool.source, {
			type: "geojson",
			data: this.geodata,
		});

		// Add a new layer to visualise the shape.
		map.addLayer({
			id: "shade-fill",
			type: "fill",
			source: ShadeTool.source,
			layout: {},
			paint: {
				"fill-color": "#00ff80",
				"fill-opacity": 0.5,
			},
		});
		// Add a black outline around the shape.
		map.addLayer({
			id: "shade-outline",
			type: "line",
			source: ShadeTool.source,
			layout: {},
			paint: {
				"line-color": "#000",
				"line-width": 3,
			},
		});
	}

	/** @param {LibreMap} map */
	onRemove(map) {
		console.log("ShadeTool#onRemove");

		map.removeLayer("shade-fill");
		map.removeLayer("shade-outline");
		map.removeSource(ShadeTool.source);
	}

	/** @param {LibreMap} map */
	onSelect(map) {
		console.log("ShadeTool#onSelect");
		this.map = map;

		map.on("mousedown", this.onMouseDown);
		map.on("mouseup", this.onMouseUp);
		map.on("mousemove", this.onMouseMove);
		map.on("mouseout", this.onMouseUp);
	}

	/** @param {LibreMap} map */
	onDeselect(map) {
		console.log("ShadeTool#onDeselect");
		// map.removeControl(this.control);

		if (this.isShading) {
			this.stopShade();
		}

		map.off("mousedown", this.onMouseDown);
		map.off("mouseup", this.onMouseUp);
		map.off("mousemove", this.onMouseMove);
		map.off("mouseout", this.onMouseOut);

		this.map = null;
	}

	getDetails() {
		/** @type {HTMLElement} */
		const elem = details.content.cloneNode(true);

		const setBrushMode = (mode) => {
			this.brush.mode = mode;
			shade.disabled = mode === "shade";
			erase.disabled = mode === "erase";
			setAriaCurrent(shade, mode === "shade");
			setAriaCurrent(erase, mode === "erase");
		};

		/** @type {HTMLInputElement} */
		const radius = elem.querySelector("#radius");
		radius.min = this.brush.min;
		radius.max = this.brush.max;
		radius.value = this.brush.size;
		radius.addEventListener("input", () => {
			this.brush.size = parseInt(radius.value);
		});
		if (this.brush.min === this.brush.max) {
			const field = elem.querySelector(".field");
			field.setAttribute("aria-hidden", true);
		}

		const shade = elem.querySelector("#shade");
		shade.addEventListener("click", () => setBrushMode("shade"));

		const erase = elem.querySelector("#erase");
		erase.addEventListener("click", () => setBrushMode("erase"));

		setBrushMode(this.brush.mode);

		return elem;
	}

	//
	// Shading
	//
	draw(lng, lat, radius, mode) {
		const fn = mode === "shade" ? union : difference;

		this.geodata = fn(
			this.geodata,
			circle([lng, lat], radius, {
				units: "meters",
				steps: 24,
			}),
		);

		if (this.geodata === null) {
			this.geodata = emptyFeature();
		}

		this.geodata = simplify(this.geodata, {
			tolerance: 0.00005,
			highQuality: true,
		});
	}

	startShade(lng, lat) {
		this.isShading = true;
		this.prevdata = structuredClone(this.geodata);

		this.draw(lng, lat, this.brush.size, this.brush.mode);
		this.map.getSource(ShadeTool.source).setData(this.geodata);
	}

	moveShade(lng, lat) {
		this.draw(lng, lat, this.brush.size, this.brush.mode);
		this.map.getSource(ShadeTool.source).setData(this.geodata);
	}

	stopShade() {
		this.map.getSource(ShadeTool.source).setData(this.geodata);

		const old = structuredClone(this.prevdata);
		const clone = structuredClone(this.geodata);

		const redo = () => {
			this.geodata = clone;
			this.map?.getSource(ShadeTool.source)?.setData(this.geodata);
		};
		const undo = () => {
			this.geodata = old;
			this.map?.getSource(ShadeTool.source)?.setData(this.geodata);
		};

		this.dispatchEvent(
			new NewActionEvent(
				{ title: this.name, undo, redo },
				{
					bubbles: true,
					cancelable: true,
					composed: true,
				},
			),
		);

		// this.geodata = null;
		this.isShading = false;
	}

	//
	// Mouse events
	//

	/** @param {LibreMouseEvent} event */
	onMouseDown(event) {
		// event.preventDefault();
		this.startShade(event.lngLat.lng, event.lngLat.lat);
	}

	/** @param {LibreMouseEvent} event */
	onMouseMove(event) {
		// event.preventDefault();
		if (!this.isShading) return;
		this.moveShade(event.lngLat.lng, event.lngLat.lat);
	}

	/** @param {LibreMouseEvent} event */
	onMouseUp() {
		if (!this.isShading) return;
		// event.preventDefault();
		this.stopShade();
	}

	/** @param {LibreMouseEvent} event */
	onMouseOut(event) {
		console.log("onMouseOut", event);
		this.stopShade();
	}

	//
	// Touch events
	//

	/** @param {LibreTouchEvent} event */
	onTouchStart(event) {
		event.preventDefault();
		this.startShade(event.lngLat.lng, event.lngLat.lat);
	}

	/** @param {LibreTouchEvent} event */
	onTouchMove(event) {
		event.preventDefault();
		if (!this.isShading) return;
		this.moveShade(event.lngLat.lng, event.lngLat.lat);
	}

	/** @param {LibreTouchEvent} event */
	onTouchEnd(event) {
		event.preventDefault();
		this.stopShade();
	}

	/** @param {LibreTouchEvent} event */
	onTouchCancel(event) {
		console.log("onTouchCancel", event);
	}
}

/** @param {HTMLElement} elem */
function setAriaCurrent(elem, value = true) {
	if (value) elem.setAttribute("aria-current", true);
	else elem.removeAttribute("aria-current");
}
