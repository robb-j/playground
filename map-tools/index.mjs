import { MapInteraction } from "./map-interaction.mjs";
import { MapToolbar } from "./map-toolbar.mjs";
import { NavigateTool } from "./navigate-tool.mjs";
import { ShadeTool } from "./shade-tool.mjs";
import { ActionStack, UndoControl, RedoControl } from "./actions.mjs";

MapToolbar.define();
MapInteraction.define();

const map = MapInteraction.query("#map");
await map.ready;

map.toolbar.addTool(new NavigateTool());
map.toolbar.addTool(
	new ShadeTool({
		min: 200,
		max: 600,
		brush: 400,
	}),
);
map.toolbar.pickTool("navigate");

map.addEventListener("newaction", (event) => {
	console.log("@newaction", event.action);
	stack.push(event.action);
});

const stack = new ActionStack();
map.toolbar.addControl(new UndoControl({ stack }));
map.toolbar.addControl(new RedoControl({ stack }));
