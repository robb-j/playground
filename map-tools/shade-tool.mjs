import { circle, union, polygonSmooth, simplify } from "@turf/turf";
import { NewActionEvent } from "./actions.mjs";

/** @typedef {import("maplibre-gl").Map} LibreMap */
/** @typedef {import("maplibre-gl").MapMouseEvent} LibreMouseEvent */

/*
	geodata could be a FeatureCollection instead.
	The first could be the live document and the second the "diff".
	Starting a draw would add to the "diff" feature
	then finishing would "commit" it to the live document and add to the action stack.
	
	There could also be "transactions" on or adjacent to the ActionStack to start something
	with the ability to "rollback" to cancel it or to "commit" it to finish and add to the ActionStack.
	
	It should show the brush on hover of the document when you aren't drawing.
*/

export class ShadeTool extends EventTarget {
	static source = "shade-tool";

	/** @type {LibreMap | null} */ map = null;
	radius = 200;

	constructor(options = {}) {
		super();
		this.id = "shade";
		this.name = options.name ?? "Shade";

		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);

		this.mouseDown = false;
		this.geodata = {
			type: "Feature",
			geometry: {
				type: "MultiPolygon",
				coordinates: [],
			},
		};
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
	onAdd(_map) {
		console.log("ShadeTool#onAdd");
	}

	/** @param {LibreMap} map */
	onRemove(_map) {
		console.log("ShadeTool#onRemove");
	}

	/** @param {LibreMap} map */
	onSelect(map) {
		console.log("ShadeTool#onSelect");
		this.map = map;

		map.on("mousedown", this.onMouseDown);
		map.on("mouseup", this.onMouseUp);
		map.on("mousemove", this.onMouseMove);

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
	onDeselect(map) {
		console.log("ShadeTool#onDeselect");
		// map.removeControl(this.control);

		map.off("mousedown", this.onMouseDown);
		map.off("mouseup", this.onMouseUp);

		map.removeLayer("shade-fill");
		map.removeLayer("shade-outline");
		map.removeSource(ShadeTool.source);

		this.map = null;
	}

	//
	// Map events
	//

	addCircle(lng, lat, radius) {
		this.geodata = union(
			this.geodata,
			circle([lng, lat], radius, {
				units: "meters",
				steps: 24,
			}),
		);

		this.geodata = simplify(this.geodata, {
			tolerance: 0.00005,
			highQuality: true,
		});
	}

	/** @param {LibreMouseEvent} event */
	onMouseDown(event) {
		console.log("onMouseDown");

		this.mouseDown = true;
		this.prevdata = structuredClone(this.geodata);

		this.addCircle(event.lngLat.lng, event.lngLat.lat, this.radius);
		this.map.getSource(ShadeTool.source).setData(this.geodata);
	}

	/** @param {LibreMouseEvent} event */
	onMouseMove(event) {
		if (!this.mouseDown) return;

		this.addCircle(event.lngLat.lng, event.lngLat.lat, this.radius);
		this.map.getSource(ShadeTool.source).setData(this.geodata);
	}

	onMouseUp() {
		console.log("onMouseUp");

		// console.log(this.geodata.geometry);
		// this.geodata = null;

		// console.log(this.geodata);

		// this.geodata = simplify(this.geodata, {
		// 	tolerance: 0.00005,
		// 	highQuality: true,
		// });

		this.map.getSource(ShadeTool.source).setData(this.geodata);
		// console.log(this.geodata);

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
				{ undo, redo },
				{
					bubbles: true,
					cancelable: true,
					composed: true,
				},
			),
		);

		// this.geodata = null;
		this.mouseDown = false;
	}
}
