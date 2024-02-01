export class ShadeTool {
	constructor(options = {}) {
		this.id = "shade";
		this.name = options.name ?? "Shade";
	}

	onAdd() {
		console.log("NavigateTool#onAdd");
	}
	onRemove() {
		console.log("NavigateTool#onRemove");
	}
	onSelect() {
		console.log("NavigateTool#onSelect");
	}
	onDeselect() {
		console.log("NavigateTool#onDeselect");
	}
}
