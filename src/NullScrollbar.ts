import { ScrollbarOperations } from "./Scrollbar";

export class NullScrollbar extends g.E implements ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;  // never be fired.

	constructor(param: g.EParameterObject) {
		super(param);
		this.onChangeBarPositionRate = new g.Trigger<number>();
	}

	destroy(): void {
		this.onChangeBarPositionRate.destroy();
		this.onChangeBarPositionRate = null;
	}

	setBarProperties(posRate?: number | null, contentlength?: number | null, viewLength?: number | null): void {
		// do nothing
	}
}
