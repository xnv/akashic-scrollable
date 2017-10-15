import { ScrollbarOperations } from "./ScrollbarLike";

export interface DefaultVerticalScrollbarParameterObject {
	scene: g.Scene;
	bgImage?: g.Surface;
	image: g.Surface;
}

export class DefaultVerticalScrollbar extends g.Pane implements ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	private _bar: g.Pane;
	private _barImage: g.Surface;
	private _contentLength: number;
	private _deltaOrigin: number;
	private _delta: number;

	constructor(param: DefaultVerticalScrollbarParameterObject) {
		super({
			scene: param.scene,
			width: param.bgImage ? param.bgImage.width : param.image.width,
			height: 0,
			backgroundImage: param.bgImage,
			backgroundEffector: param.bgImage && new g.NinePatchSurfaceEffector(param.scene.game, Math.floor(param.bgImage.width / 2))
		});
		this.onChangeBarPositionRate = new g.Trigger<number>();
		this._bar = new g.Pane({
			scene: param.scene,
			parent: this,
			width: param.bgImage ? param.bgImage.width : param.image.width,
			height: 0,
			backgroundImage: param.image,
			backgroundEffector: new g.NinePatchSurfaceEffector(param.scene.game, Math.floor(param.image.width / 2)),
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
		if (viewLength != null && this.height !== viewLength) {
			this.height = viewLength;
			this.invalidate();
		}
		const barHeight = (this.height < this._contentLength) ? Math.floor(Math.max(this.height * this.height / this._contentLength, this._barImage.height)) : 0;
		const barPos = Math.floor(Math.max(posRate * this.height));
		if (this._bar.height !== barHeight) {
			this._bar.height = barHeight;
			this._bar.invalidate();
		}
		if (this._bar.y !== barPos) {
			this._bar.y = barPos;
			this._bar.modified();

			// reset to be safe... unnecessary?
			this._deltaOrigin = this._bar.y;
			this._delta = 0;
		}
	}

	private _handleBarPointDown(ev: g.PointDownEvent): void {
		this._deltaOrigin = this._bar.y;
		this._delta = 0;
	}

	private _handleBarPointMove(ev: g.PointMoveEvent): void {
		this._delta += ev.prevDelta.y;
		const limit = this.height - this._bar.height;
		const next = Math.min(Math.max(this._deltaOrigin + this._delta, 0), limit);
		if (this._bar.y === next)
			return;
		this._bar.y = next;
		this._bar.modified();
		this.onChangeBarPositionRate.fire(next / this.height);
	}
}
