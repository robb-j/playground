import { MapControlStateEvent } from "./map-toolbar.mjs";

/**
	@typedef {object} Action
	@property {string | undefined} title
	@property {Function} redo
	@property {Function} undo
*/

export class ActionStackChangeEvent extends Event {
	/**
		@param {ActionStack} stack
		@param {EventInit | undefined} init
	*/
	constructor(stack, init) {
		super("stackchange", init);
		this.stack = stack;
	}
}

export class NewActionEvent extends Event {
	/**
		@param {Action} action
		@param {EventInit | undefined} init
	*/
	constructor(action, init) {
		super("newaction", init);
		this.action = action;
	}
}

export class ActionStack extends EventTarget {
	isActing = false;
	position = -1;
	/** @type {Action[]} */ actions = [];

	redo() {
		if (!this.canRedo()) {
			console.debug("nothing to redo");
			return;
		}
		this.position += 1;
		const action = this.actions[this.position];

		console.debug(
			"ActionStack#redo length=%o position=%o",
			this.actions.length,
			this.position,
		);
		this.act(() => action.redo());
		this.dispatchEvent(new ActionStackChangeEvent());
	}
	undo() {
		if (!this.canUndo()) {
			console.debug("nothing to undo");
			return;
		}
		const action = this.actions[this.position];
		this.position -= 1;

		console.debug(
			"ActionStack#undo length=%o position=%o",
			this.actions.length,
			this.position,
		);
		this.act(() => action.undo());
		this.dispatchEvent(new ActionStackChangeEvent());
	}
	act(fn) {
		this.isActing = true;
		fn();
		this.isActing = false;
	}
	getNextUndo() {
		return this.canUndo() ? this.actions[this.position] : null;
	}
	canUndo() {
		return this.position >= 0;
	}
	getNextRedo() {
		return this.canRedo() ? this.actions[this.position + 1] : null;
	}
	canRedo() {
		return this.position < this.actions.length - 1;
	}

	/** @param {Action} action */
	push(action) {
		console.debug(
			"ActionStack#push length=%o position=%o",
			this.actions.length,
			this.position,
		);
		if (this.isActing) {
			throw new Error("Cannot add an action whle performing an action");
		}
		this.actions.splice(this.position + 1, Infinity, action);
		this.position = this.actions.length - 1;
		this.dispatchEvent(new ActionStackChangeEvent());
	}
}

export class RedoControl extends EventTarget {
	/** @param {{ name?: string, stack: ActionStack }} options */
	constructor(options) {
		super();
		this.id = "redo";
		this.name = options.name ?? "Redo";
		this.stack = options.stack;

		this.onStackChange = this.onStackChange.bind(this);
	}

	onAdd() {
		this.stack.addEventListener("stackchange", this.onStackChange);
		this.dispatchState();
	}
	onRemove() {
		this.stack.removeEventListener("stackchange", this.onStackChange);
	}
	onTrigger() {
		this.stack.redo();
	}
	onStackChange() {
		this.dispatchState();
	}
	dispatchState() {
		const action = this.stack.getNextRedo();
		this.dispatchEvent(
			new MapControlStateEvent(this, {
				title: action?.title ? `Redo ${action.title}` : undefined,
				disabled: !action,
			}),
		);
	}
}

export class UndoControl extends EventTarget {
	/** @param {{ name?: string, stack: ActionStack }} options */
	constructor(options = {}) {
		super();
		this.id = "undo";
		this.name = options.name ?? "Undo";
		this.stack = options.stack;

		this.onStackChange = this.onStackChange.bind(this);
	}

	onAdd() {
		this.stack.addEventListener("stackchange", this.onStackChange);
		this.dispatchState();
	}
	onRemove() {
		this.stack.removeEventListener("stackchange", this.onStackChange);
	}
	onTrigger() {
		this.stack.undo();
	}
	onStackChange() {
		this.dispatchState();
	}
	dispatchState() {
		// this.dispatchEvent(new MapControlDisableEvent(this, !this.stack.canUndo()));
		const action = this.stack.getNextUndo();
		this.dispatchEvent(
			new MapControlStateEvent(this, {
				title: action?.title ? `Undo ${action.title}` : undefined,
				disabled: !action,
			}),
		);
	}
}
