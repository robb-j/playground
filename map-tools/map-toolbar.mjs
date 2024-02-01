import maplibregl from "maplibre-gl";
import { alembicStyles } from "../pmtiles/tools.mjs";

const template = document.createElement("template");
template.innerHTML = `
	${alembicStyles}
	<link rel="stylesheet" href="https://alembic.openlab.dev/labcoat.css" />
	<cluster-layout space="var(--s-3)" align="space-between">
		<reel-layout class="tools"></reel-layout>
		<cluster-layout class="controls"></cluster-layout>
	</cluster-layout>
`;

const style = new CSSStyleSheet();
style.replaceSync(`
	map-toolbar {
		display: block;
		border: var(--s-5) solid var(--border);
		padding: var(--s-3);
		border-bottom-left-radius: 0.5em;
		border-bottom-right-radius: 0.5em;
	}
	.tools {
		min-height: 2rem;
	}
	.message {
		margin: 1rem 0 0;
		font-size: 1.2em;
		font-weight: italic;
	}

	.tool {
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		background: none;
		border: none;
		padding: 0.5em;
		margin: 0;
		align-items: center;
		cursor: pointer;
		border: var(--s-5) solid transparent;
	}
	.tool:focus {
		outline: none;
	}
	.tool[aria-selected="true"] {
		border-color: var(--color);
		background-color: var(--highlight);
	}
	.tool-icon {
		display: block;
		background-color: rgb(80, 250, 123);
		border-radius: 100%;
		width: 3em;
		height: 3em;
	}
	.tool-name {

	}
`);

/** @typedef {(interaction: import("./map-interaction.mjs").MapInteraction, toolbar: MapToolbar) => void} MapCallback */

/**
	@typedef {object} MapTool
	@property {string} id
	@property {string} name
	@property {MapCallback} onAdd
	@property {MapCallback} onRemove
	@property {MapCallback} onSelect
	@property {MapCallback} onDeselect
*/

/**
	@typedef {object} MapControl
	@property {string} id
	@property {string} name
	@property {MapCallback} onAdd
	@property {MapCallback} onRemove
*/

export class MapToolbar extends HTMLElement {
	static define() {
		customElements.define("map-toolbar", this);
	}

	/** @type {Map<string, MapTool>} */ tools = new Map();
	/** @type {Map<string, MapControl>} */ controls = new Map();
	/** @type {maplibregl.Map} */ map = null;

	get toolsElem() {
		return this.shadowRoot.querySelector(".tools");
	}
	get controlsElem() {
		return this.shadowRoot.querySelector(".controls");
	}

	constructor() {
		super();

		const root = this.attachShadow({ mode: "open" });
		root.appendChild(template.content.cloneNode(true));
		root.adoptedStyleSheets.push(style);
	}

	/** @param {MapTool} tool */
	addTool(tool) {
		if (this.tools.has(tool.id)) {
			throw new Error("Tool exists: " + tool.id);
		}

		const button = document.createElement("button");
		button.classList.add("tool");
		button.dataset.tool = tool.id;

		button.innerHTML = `
			<span class="tool-icon" style="background-color: ${tool.color}"></span>
			<span class="tool-name">${tool.name}</span>
		`;

		button.addEventListener("click", () => this.pickTool(tool.id));

		this.tools.set(tool.id, tool);
		this.toolsElem.appendChild(button);
		tool.onAdd?.(this.map);
	}

	getTool(id) {
		const tool = this.tools.get(id);
		if (!tool) throw new Error("Invalid tool: " + id);
		return tool;
	}

	pickTool(id) {
		const tool = this.getTool(id);
		const current = this.toolsElem.querySelector('[aria-selected="true"]');

		if (current?.dataset.tool === id) {
			console.debug("already selected");
			return;
		}

		for (const child of this.toolsElem.children) {
			if (child.dataset.tool === id) {
				child.setAttribute("aria-selected", "true");
				tool.onSelect?.(this.map);
			} else {
				const tool = this.getTool(child.dataset.tool);
				child.removeAttribute("aria-selected");
				tool.onDeselect?.(this.map);
			}
		}
		this.dispatchEvent(new MapToolChangeEvent(tool));
	}

	getToolButton(id) {
		return this.shadowRoot.querySelector(`.tool[data-tool="${id}"`);
	}

	removeTool(id) {
		const tool = this.getTool(id);
		for (const child of this.toolsElem.children) {
			if (child.dataset.tool === tool.id) this.toolsElem.removeChild(t);
		}
		tool.onRemove?.(this.map);
	}

	getControl(id) {
		const control = this.controls.get(id);
		if (!control) throw new Error("Invalid control: " + id);
		return control;
	}

	/** @param {MapControl} control */
	addControl(control) {
		if (this.controls.has(control.id)) {
			throw new Error("Control exists: " + control.id);
		}

		const button = document.createElement("button");
		button.classList.add("control");
		button.dataset.control = control.id;

		button.textContent = control.name;
		button.addEventListener("click", () => {});
	}

	triggerControl(id) {
		const control = this.getControl(id);
		// ...
	}

	removeControl(id) {
		const control = this.getControl(id);

		for (const child of this.controlsElem.children) {
			if (child.dataset.control === control.id) {
				this.controlsElem.removeChild(t);
			}
		}
	}
}

export class MapToolChangeEvent extends CustomEvent {
	/** @param {MapTool} tool */
	constructor(tool) {
		super("maptoolchange");
		this.tool = tool;
	}
}

export class MapControlChangeEvent extends CustomEvent {
	/** @param {MapControl} control */
	constructor(control) {
		super("mapcontrolchange");
		this.control = control;
	}
}
