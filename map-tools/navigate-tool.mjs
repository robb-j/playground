import maplibregl from "maplibre-gl";

export class NavigateTool {
	constructor(options = {}) {
		this.id = "navigate";
		this.name = options.name ?? "Navigate";
	}

	onAdd(map) {
		console.log("NavigateTool#onAdd");
		this.setMapInteractivity(map, false);
	}
	onRemove(map) {
		console.log("NavigateTool#onRemove");
		this.setMapInteractivity(map, true);
	}
	onSelect(map) {
		console.log("NavigateTool#onSelect");
		this.setMapInteractivity(map, true);
	}
	onDeselect(map) {
		console.log("NavigateTool#onDeselect");
		this.setMapInteractivity(map, false);
	}

	/** @param {maplibregl.Map} map */
	setMapInteractivity(map, interactive) {
		console.log("setMapInteractivity", interactive);
		const method = interactive ? "enable" : "disable";
		map.scrollZoom[method]();
		map.boxZoom[method]();
		map.dragRotate[method]();
		map.dragPan[method]();
		map.keyboard[method]();
		map.doubleClickZoom[method]();
		map.touchZoomRotate[method]();
	}
}
