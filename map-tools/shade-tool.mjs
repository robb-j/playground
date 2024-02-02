export class ShadeTool {
	constructor(options = {}) {
		this.id = "shade";
		this.name = options.name ?? "Shade";
	}

	onAdd() {
		console.log("ShadeTool#onAdd");
	}
	onRemove() {
		console.log("ShadeTool#onRemove");
	}
	onSelect() {
		console.log("ShadeTool#onSelect");
	}
	onDeselect() {
		console.log("ShadeTool#onDeselect");
	}
}
