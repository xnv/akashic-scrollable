import { ScrollbarOperations } from "./ScrollbarLike";

export interface DefaultHorizontalScrollbarParameterObject {
	scene: g.Scene;
	bgImage?: g.Surface;
	image: g.Surface;
}

export class DefaultHorizontalScrollbar extends g.Pane implements ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	private _bar: g.Pane;
	private _barImage: g.Surface;
	private _contentLength: number;
	private _deltaOrigin: number;
	private _delta: number;

	constructor(param: DefaultHorizontalScrollbarParameterObject) {
		super({
			scene: param.scene,
			width: 0,
			height: param.bgImage ? param.bgImage.height : param.image.height,
			backgroundImage: param.bgImage,
			backgroundEffector: param.bgImage && new g.NinePatchSurfaceEffector(param.scene.game, Math.floor(param.bgImage.height / 2))
		});
		this.onChangeBarPositionRate = new g.Trigger<number>();
		this._bar = new g.Pane({
			scene: param.scene,
			parent: this,
			width: 0,
			height: param.bgImage ? param.bgImage.height : param.image.height,
			backgroundImage: param.image,
			backgroundEffector: new g.NinePatchSurfaceEffector(param.scene.game, Math.floor(param.image.height / 2)),
			touchable: true
		});
		this._barImage = param.image;
		this._contentLength = 0;
		this._deltaOrigin = 0;
		this._delta = 0;

		this._bar.pointDown.add(this._handleBarPointDown, this);
		this._bar.pointMove.add(this._handleBarPointMove, this);
	}

	destroy(): void {
		this.onChangeBarPositionRate.destroy();
		this.onChangeBarPositionRate = null;
		this._bar = null;
		this._barImage = null;
		this._contentLength = 0;
		super.destroy();
	}

	setBarProperties(posRate?: number | null, contentLength?: number | null, viewLength?: number | null): void {
		if (contentLength != null && this._contentLength !== contentLength) {
			this._contentLength = contentLength;
		}
		if (viewLength != null && this.width !== viewLength) {
			this.width = viewLength;
			this.invalidate();
		}
		const barWidth = (this.width < this._contentLength) ? Math.floor(Math.max(this.width * this.width / this._contentLength, this._barImage.width)) : 0;
		const barPos = Math.floor(Math.max(posRate * this.width));
		if (this._bar.width !== barWidth) {
			this._bar.width = barWidth;
			this._bar.invalidate();
		}
		if (this._bar.x !== barPos) {
			this._bar.x = barPos;
			this._bar.modified();

			// reset to be safe... unnecessary?
			this._deltaOrigin = this._bar.x;
			this._delta = 0;
		}
	}

	private _handleBarPointDown(ev: g.PointDownEvent): void {
		this._deltaOrigin = this._bar.x;
		this._delta = 0;
	}

	private _handleBarPointMove(ev: g.PointMoveEvent): void {
		this._delta += ev.prevDelta.x;
		const limit = this.width - this._bar.width;
		const next = Math.min(Math.max(this._deltaOrigin + this._delta, 0), limit);
		if (this._bar.x === next)
			return;
		this._bar.x = next;
		this._bar.modified();
		this.onChangeBarPositionRate.fire(next / this.width);
	}
}
