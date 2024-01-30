const template = document.createElement("template");
template.innerHTML = `
	<p part="message">Pick a tool...</p>
	<cluster-layout part="tools" space="var(--s-3)"></cluster-layout>
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
	map-toolbar::part(tools) {
		min-height: 2rem;
	}
	map-toolbar::part(message) {
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

let addedStyle = false;

export class MapToolbarElement extends HTMLElement {
	static define() {
		customElements.define("map-toolbar", this);
	}
	/** @returns {MapToolbarElement} */
	static query(selector) {
		return document.querySelector(selector);
	}

	get tools() {
		return this.querySelector("cluster-layout");
	}
	get message() {
		return this.querySelector("p");
	}

	/** @type {WeakMap<HTMLElement, MapTool>} */
	toolLookup = new WeakMap();

	constructor() {
		super();

		this.appendChild(template.content.cloneNode(true));
		if (!addedStyle) {
			document.adoptedStyleSheets.push(style);
			addedStyle = true;
		}
	}

	/** @param {MapTool} tool */
	addTool(tool) {
		const button = document.createElement("button");
		button.classList.add("tool");
		button.dataset.tool = tool.id;

		const circle = button.appendChild(document.createElement("span"));
		circle.classList.add("tool-icon");
		circle.style.backgroundColor = tool.color;

		const name = button.appendChild(document.createElement("span"));
		name.classList.add("tool-name");
		name.textContent = tool.name;

		this.toolLookup.set(button, tool);

		button.addEventListener("click", () => {
			const selected = [];
			for (const child of this.tools.querySelectorAll(
				'[aria-selected="true"]'
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
			this.message.textContent = tool.name;
		});

		this.tools.appendChild(button);
	}
	removeTool(id) {
		for (const t of this.tools.children) {
			if (t.dataset.tool === id) this.tools.removeChild(t);
		}
	}
}

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
