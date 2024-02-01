import { MapInteraction } from "./map-interaction.mjs";
import { MapToolbar } from "./map-toolbar.mjs";
import { NavigateTool } from "./navigate-tool.mjs";
import { ShadeTool } from "./shade-tool.mjs";

MapToolbar.define();
MapInteraction.define();

const map = MapInteraction.query("#map");
map.toolbar.addTool(new NavigateTool());
map.toolbar.addTool(new ShadeTool());
map.toolbar.pickTool("navigate");
