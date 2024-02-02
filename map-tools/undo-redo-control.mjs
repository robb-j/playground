import { MapControlDisableEvent } from "./map-toolbar.mjs";

// export class Action {
// 	perform() {}
// 	undo() {}
// }

/**
	@typedef {object} Action
	@property {Function} perform
	@property {Function} undo
*/

export class ActionStackChangeEvent extends Event {
	/** @param {ActionStack} stack */
	constructor(stack, init) {
		super("stackchange", init);
		this.stack = stack;
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
		this.act(() => action.perform());
		this.dispatchEvent(new ActionStackChangeEvent());
	}
	undo() {
		if (!this.canUndo()) {
			console.debug("nothing to undo");
			return;
		}
		const action = this.actions[this.position];
		this.position -= 1;
		this.act(() => action.undo());
		this.dispatchEvent(new ActionStackChangeEvent());
	}
	act(fn) {
		this.isActing = true;
		fn();
		this.isActing = false;
	}
	canUndo() {
		return this.position >= 0;
	}
	canRedo() {
		return this.position < this.actions.length - 1;
	}

	/** @param {Action} action */
	push(action) {
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
		this.dispatchEvent(new MapControlDisableEvent(this, !this.stack.canRedo()));
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
		this.dispatchEvent(new MapControlDisableEvent(this, !this.stack.canUndo()));
	}
}
