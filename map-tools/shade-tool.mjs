// import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { circle, union, polygonSmooth } from "@turf/turf";

/** @typedef {import("maplibre-gl").Map} LibreMap */
/** @typedef {import("maplibre-gl").MapMouseEvent} LibreMouseEvent */

export class ShadeTool {
	/** @type {LibreMap | null} */ map = null;
	radius = 200;

	constructor(options = {}) {
		this.id = "shade";
		this.name = options.name ?? "Shade";

		// this.control = new MapboxDraw({
		// 	displayControlsDefault: false,
		// 	controls: {
		// 		polygon: true,
		// 		trash: true,
		// 	},
		// });

		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);

		this.mouseDown = false;
		this.geodata = null;
		this.map = null;
	}

	/** @param {LibreMap} map */
	// onAdd(map) {
	// 	console.log("ShadeTool#onAdd");
	// 	this.map = map;
	// }
	/** @param {LibreMap} map */

	// onRemove(map) {
	// 	console.log("ShadeTool#onRemove");
	// 	this.map = null;
	// }

	/** @param {LibreMap} map */
	onSelect(map) {
		console.log("ShadeTool#onSelect");
		this.map = map;

		map.on("mousedown", this.onMouseDown);
		map.on("mouseup", this.onMouseUp);
		map.on("mousemove", this.onMouseMove);

		map.addSource("shade-control", {
			type: "geojson",
			data: {
				type: "Feature",
				geometry: {
					type: "Polygon",
					// These coordinates outline Maine.
					coordinates: [[]],
				},
			},
		});

		// Add a new layer to visualize the polygon.
		map.addLayer({
			id: "shade-fill",
			type: "fill",
			source: "shade-control", // reference the data source
			layout: {},
			paint: {
				"fill-color": "#00ff80", // blue color fill
				"fill-opacity": 0.5,
			},
		});
		// Add a black outline around the polygon.
		map.addLayer({
			id: "shade-outline",
			type: "line",
			source: "shade-control",
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
		map.removeSource("shade-control");

		this.map = null;
	}

	//
	// Map events
	//

	/** @param {LibreMouseEvent} event */
	onMouseDown(event) {
		console.log("onMouseDown", event.lngLat.lng, event.lngLat.lat);

		this.mouseDown = true;
		if (!this.geodata) {
			this.geodata = {
				type: "Feature",
				geometry: {
					type: "Polygon",
					coordinates: [],
				},
			};
		}
		this.map.getSource("shade-control").setData(this.geodata);
	}

	/** @param {LibreMouseEvent} event */
	onMouseMove(event) {
		if (!this.mouseDown) return;

		this.geodata = union(
			this.geodata,
			circle([event.lngLat.lng, event.lngLat.lat], this.radius, {
				units: "meters",
				steps: 32,
			}),
		);

		// this.geodata.geometry.coordinates[0].push([
		// 	event.lngLat.lng,
		// 	event.lngLat.lat,
		// ]);
		this.map.getSource("shade-control").setData(this.geodata);
	}

	onMouseUp() {
		console.log("onMouseUp");

		console.log(this.geodata.geometry);
		// this.geodata = null;
		this.geodata = polygonSmooth(this.geodata, {
			iterations: 2,
		});
		this.map.getSource("shade-control").setData(this.geodata);

		// this.geodata = null;
		this.mouseDown = false;
	}
}
