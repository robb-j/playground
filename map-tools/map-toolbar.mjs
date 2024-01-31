import maplibregl from "maplibre-gl";

const template = document.createElement("template");
template.innerHTML = `
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

/**
 * @typedef {object} MapTool
 * @property {string} id
 * @property {string} name
 * @property {string} color ~ would be "icon" in the future
 * @property {Function?} onSelect
 * @property {Function?} onDeselect
 */

/** @typedef {(interaction: unknown, map: maplibregl.Map) => void} MapCallback */

/**
	@typedef {object} MapTool
	@property {string} id
	@property {string} name
	@property {MapCallback} onAdd
	@property {MapCallback} onRemove
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
	}

	/** @param {MapTool} tool */
	pickTool(id) {
		const tool = this.tools.get(id);
		if (!tool) throw new Error("Invalid tool: " + id);

		const button = this.getToolButton(id);

		const selected = [];
		for (const child of this.toolsElem.querySelectorAll(
			'[aria-selected="true"]',
		)) {
			selected.push(child);
			if (child !== button) {
				this.toolLookup.get(child)?.onDeselect?.();
				child.removeAttribute("aria-selected");
			}
		}

		if (selected.every((e) => e !== button)) {
			button.setAttribute("aria-selected", "true");
			tool.onSelect?.();
		}
		button.blur();
		this.dispatchEvent(new MapToolChangeEvent(tool));
	}

	getToolButton(id) {
		return this.shadowRoot.querySelector(`.tool[data-tool="${id}"`);
	}

	/** @param {MapTool} tool */
	removeTool(tool) {
		for (const child of this.toolsElem.children) {
			if (child.dataset.tool === tool.id) this.toolsElem.removeChild(t);
		}
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
		const control = this.controls.get(id);
		if (!control) throw new Error("Invalid control: " + id);
	}

	/** @param {MapControl} control */
	removeControl(control) {
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
