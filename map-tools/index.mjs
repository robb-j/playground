import { MapInteraction } from "./map-interaction.mjs";
import { MapToolbar } from "./map-toolbar.mjs";
import { NavigateTool } from "./navigate-tool.mjs";
import { ShadeTool } from "./shade-tool.mjs";
import { ActionStack, UndoControl, RedoControl } from "./undo-redo-control.mjs";

MapToolbar.define();
MapInteraction.define();

const map = MapInteraction.query("#map");
map.toolbar.addTool(new NavigateTool());
map.toolbar.addTool(new ShadeTool());
map.toolbar.pickTool("navigate");

const stack = new ActionStack();
map.toolbar.addControl(new UndoControl({ stack }));
map.toolbar.addControl(new RedoControl({ stack }));

const state = {
	name: "Geoff",
	age: 42,
};

stack.push({
	perform() {
		state.name = "Geoff";
	},
	undo() {
		state.name = "Philip";
	},
});
stack.push({
	perform() {
		state.age = 42;
	},
	undo() {
		state.age = 33;
	},
});
stack.push({
	perform() {
		delete state.pets;
	},
	undo() {
		state.pets = ["Hugo"];
	},
});

stack.addEventListener("stackchange", () => {
	console.log("stackchange", state);
});
