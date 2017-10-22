import { ScrollbarOperations } from "./Scrollbar";

/**
 * The type of the argument of `new NinePatchVerticalScrollbar()`.
 *
 * `new NinePatchVerticalScrollbar()` の引数の型。
 */
export interface NinePatchVerticalScrollbarParameterObject {
	scene: g.Scene;
	bgImage?: g.Surface;
	image: g.Surface;
}

/**
 * The ninepatch image vertical scrollbar entity.
 * Takes two images as ninepatch images for the background and the bar itself.
 *
 * 9パッチ画像の縦スクロールバー。
 * 二つの画像(背景用・バー用)をとり、9パッチで拡大して利用する。
 */
export class NinePatchVerticalScrollbar extends g.Pane implements ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	private _bar: g.Pane;
	private _barImage: g.Surface;
	private _contentLength: number;
	private _deltaOrigin: number;
	private _delta: number;

	constructor(param: NinePatchVerticalScrollbarParameterObject) {
		super({
			scene: param.scene,
			width: param.bgImage ? param.bgImage.width : param.image.width,
			height: 0,
			backgroundImage: param.bgImage,
			backgroundEffector: param.bgImage && new g.NinePatchSurfaceEffector(param.scene.game, Math.floor(param.bgImage.width / 2)),
			touchable: true
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

		this.pointDown.add(this._handlePointDown, this);
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
		let barHeight = 0;
		if (this.height < this._contentLength)
			barHeight = Math.floor(Math.max(this.height * this.height / this._contentLength, this._barImage.height));
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

	private _handlePointDown(ev: g.PointDownEvent): void {
		if (ev.point.y < this._bar.y) {
			this._changePositionRate(this._bar.y - this._bar.height);
		} else if (ev.point.y > this._bar.y + this._bar.height) {
			this._changePositionRate(this._bar.y + this._bar.height);
		}
	}

	private _handleBarPointDown(ev: g.PointDownEvent): void {
		this._deltaOrigin = this._bar.y;
		this._delta = 0;
	}

	private _handleBarPointMove(ev: g.PointMoveEvent): void {
		this._delta += ev.prevDelta.y;
		this._changePositionRate(this._deltaOrigin + this._delta);
	}

	private _changePositionRate(rate: number): void {
		const limit = this.height - this._bar.height;
		const next = Math.min(Math.max(rate, 0), limit);
		if (this._bar.y === next)
			return;
		this._bar.y = next;
		this._bar.modified();
		this.onChangeBarPositionRate.fire(next / this.height);
	}
}
