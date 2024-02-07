import maplibregl from "maplibre-gl";
import { alembicStyles } from "../pmtiles/tools.mjs";

const template = document.createElement("template");
template.innerHTML = `
	${alembicStyles}
	<stack-layout space="s-1">
		<cluster-layout space="var(--s-3)" class="wrapper">
			<reel-layout class="tools"></reel-layout>
			<cluster-layout class="controls"></cluster-layout>
		</cluster-layout>
		<slot name="details"></slot>
	</stack-layout>
`;

const style = new CSSStyleSheet();
style.replaceSync(`
	:host {
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
	.tool[aria-current="true"] {
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
	/* Currently Alembic doesn't handle extra styles in the shadow DOM */
	.wrapper {
		justify-content: space-between;
	}
	.controls {
		gap: var(--s-2);
	}
`);

/**
	@typedef {object} MapTool
	@property {string} id
	@property {string} name
	@property {Function} onAdd
	@property {Function} onRemove
	@property {Function} onSelect
	@property {Function} onDeselect
	@property {Function | undefined} getDetails
*/

/**
	@typedef {object} MapControl
	@property {string} id
	@property {string} name
	@property {Function} onAdd
	@property {Function} onRemove
	@property {Function} onTrigger
	@property {(event: string, handler: Function) => void} addEventListener
	@property {(event: string, handler: Function) => void} removeEventListener
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

		this.onControlState = this.onControlState.bind(this);
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
		tool.bubbleDaddy = this;

		this.tools.set(tool.id, tool);
		this.toolsElem.appendChild(button);
		tool.onAdd?.(this.map);
	}

	getTool(id) {
		const tool = this.tools.get(id);
		if (!tool) throw new Error("Invalid tool: " + id);
		return tool;
	}

	/** @returns {HTMLButtonElement} */
	getToolElement(id) {
		return this.toolsElem.querySelector(`[data-tool="${id}"]`);
	}

	pickTool(id) {
		const tool = this.getTool(id);
		const current = this.toolsElem.querySelector('[aria-current="true"]');

		if (current?.dataset.tool === id) {
			console.debug("already selected");
			return;
		}

		/** @type {HTMLElement | null} */
		let details = null;

		for (const child of this.toolsElem.children) {
			if (child.dataset.tool === id) {
				child.setAttribute("aria-current", "true");
				tool.onSelect?.(this.map);
				details = tool.getDetails?.(this.map);
			} else if (child.hasAttribute("aria-current")) {
				const tool = this.getTool(child.dataset.tool);
				child.removeAttribute("aria-current");
				tool.onDeselect?.(this.map);
			}
		}

		for (const child of this.children) {
			if (child.slot === "details") this.removeChild(child);
		}

		console.log(details);

		if (details) {
			const wrapper = document.createElement("div");
			wrapper.slot = "details";
			wrapper.appendChild(details);
			this.appendChild(wrapper);
		}

		this.dispatchEvent(new MapToolChangeEvent(tool));
	}

	removeTool(id) {
		const tool = this.getTool(id);
		this.toolsElem.removeChild(this.getToolElement(id));
		tool.onRemove?.(this.map);
	}

	getControl(id) {
		const control = this.controls.get(id);
		if (!control) throw new Error("Invalid control: " + id);
		return control;
	}

	/** @returns {HTMLButtonElement} */
	getControlElement(id) {
		return this.controlsElem.querySelector(`[data-control="${id}"]`);
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
		button.addEventListener("click", () => this.triggerControl(control.id));

		control.addEventListener?.("controlstate", this.onControlState);

		this.controls.set(control.id, control);
		this.controlsElem.appendChild(button);
		control.onAdd?.();
	}

	triggerControl(id) {
		this.getControl(id).onTrigger();
	}

	removeControl(id) {
		const control = this.getControl(id);

		this.controlsElem.removeChild(this.getControlElement(id));

		control.removeEventListener?.("controlstate", this.onControlState);

		control.onRemove?.();
	}

	/** @param {MapControlStateEvent} event */
	onControlState(event) {
		console.log("@controlstate", event);
		const elem = this.getControlElement(event.control.id);
		elem.disabled = event.state.disabled;
		elem.title = event.state.title ?? "Undo action";
	}
}

export class MapToolChangeEvent extends Event {
	/** @param {MapTool} tool */
	constructor(tool, init) {
		super("maptoolchange", init);
		this.tool = tool;
	}
}

// export class MapControlDisableEvent extends Event {
// 	/**
// 		@param {MapControl} control
// 		@param {boolean} disabled
// 		@param {EventInit} init
// 	*/
// 	constructor(control, disabled, init) {
// 		super("controldisabled", init);
// 		this.control = control;
// 		this.disabled = disabled;
// 	}
// }

export class MapControlStateEvent extends Event {
	/**
		@param {MapControl} control
		@param {{ disabled?: boolean, title?: string }} state
		@param {EventInit | undefined} init
	*/
	constructor(control, state, init) {
		super("controlstate", init);
		this.control = control;
		this.state = state;
	}
}
