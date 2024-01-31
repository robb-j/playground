export class NavigateTool {
	constructor(options = {}) {
		this.id = "navigate";
		this.name = options.name ?? "Navigate";
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
