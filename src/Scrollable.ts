import { createDefaultScrollbarImage } from "./createDefaultScrollbarImage";
import { Scrollbar } from "./Scrollbar";
import { NullScrollbar } from "./NullScrollbar";
import { NinePatchVerticalScrollbar } from "./NinePatchVerticalScrollbar";
import { NinePatchHorizontalScrollbar } from "./NinePatchHorizontalScrollbar";

class MomentumBuffer {
	private _buf: g.CommonOffset[];
	private _i: number;
	private _disposed: number | null;
	constructor(len: number) {
		this._buf = new Array<g.CommonOffset>(len);
		this._i = 0;
		this._disposed = null;
	}
	addDelta(v: g.CommonOffset): void {
		this._buf[this._i] = v;
		this._i = (this._i + 1) % this._buf.length;
		if (this._i === this._disposed)
			this._disposed = null;
	}
	average(): g.CommonOffset {
		let x = 0, y = 0, cnt = 0;
		let i = (this._disposed != null) ? this._disposed : (this._i + 1) % this._buf.length;
		for (; i !== this._i; i = (i + 1) % this._buf.length) {
			x += this._buf[i].x;
			y += this._buf[i].y;
			++cnt;
		}
		return (cnt > 0) ? { x: x / cnt, y: y / cnt } : { x: 0, y: 0 };
	}
	reset(): void {
		this._disposed = this._i;
	}
}

export interface FrameTaskData {
	type: "scroll" | "momentum";
	count: number;
	origX?: number;
	origY?: number;
	x?: number;
	y?: number;
	perX?: number;
	perY?: number;
	duration?: number;
	easing?: (rate: number) => number;
	done?: boolean;
}

export class ScrolledContent extends g.E {
	onModified: g.Trigger<void>;
	constructor(param: g.EParameterObject) {
		super(param);
		this.onModified = new g.Trigger<void>();
	}
	destroy(): void {
		this.onModified.destroy();
		this.onModified = null;
		super.destroy();
	}
	modified(isBubbling?: boolean) {
		// Ugh! check existence since Akashic Engine calls this method while destroy()ing...
		if (this.onModified) {
			this.onModified.fire();
		}
		return super.modified(isBubbling);
	}
}

export class ScrolledContentContainer extends g.E {
	onContentModified: g.Trigger<void>;
	private _offsetContainer: g.E;
	private _content: ScrolledContent;

	constructor(param: g.EParameterObject) {
		super(param);
		this.onContentModified = new g.Trigger<void>();
		this._offsetContainer = new g.E({ scene: param.scene, parent: this });
		this._content = new ScrolledContent({ scene: param.scene, parent: this._offsetContainer });
		this._content.onModified.add(this.onContentModified.fire, this.onContentModified);
	}

	destroy(): void {
		this.onContentModified.destroy();
		this.onContentModified = null;
		super.destroy();
	}

	offsetContainer(): g.E {
		return this._offsetContainer;
	}

	content(): g.E {
		return this._content;
	}
}

/**
 * The type of the argument of `new Scrollable()`.
 *
 * `new Scrollable()` の引数の型。
 */
export interface ScrollableParameterObject extends g.EParameterObject {
	/**
	 * The width of this entity and the width of the scrolled area.
	 * Unless `insetBars`, the scrollbars are shown outside of the width.
	 *
	 * このエンティティの幅・スクロール領域の幅。
	 * `insetBars` が真でなければ、スクロールバーはこの幅の外側に表示される。
	 */
	width: number;

	/**
	 * The height of this entity and the height of the scrolled area.
	 * Unless `insetBars`, the scrollbars are shown outside of the height.
	 *
	 * このエンティティの高さ・スクロール領域の高さ。
	 * `insetBars` が真でなければ、スクロールバーはこの高さの外側に表示される。
	 */
	height: number;

	/**
	 * Enable/disable vertical scrolling.
	 * If a `Scrollbar` is given, it is used as the vertical scrollbar instead of the default one.
	 * If not specified, `false`.
	 *
	 * 縦方向のスクロールを有効にするか。
	 * `Scrollbar` が指定された場合、有効になり、値はデフォルトの縦スクロールバーの代わりに利用される。
	 * 省略された場合、偽。
	 */
	vertical?: boolean | Scrollbar;

	/**
	 * Enable/disable horizontal scrolling.
	 * If a `Scrollbar` is given, it is used as the horizontal scrollbar instead of the default one.
	 * If not specified, `false` .
	 *
	 * 縦方向のスクロールを有効にするか。
	 * `Scrollbar` が指定された場合、有効になり、値はデフォルトの横スクロールバーの代わりに利用される。
	 * 省略された場合、偽。
	 */
	horizontal?: boolean | Scrollbar;

	/**
	 * Enable/disable scrolling by dragging on the entity itself.
	 * If not specified, `false`.
	 *
	 * エンティティ自体のドラッグ操作によるスクロールを有効にするか。
	 * 省略された場合、偽。
	 */
	touchScroll?: boolean;

	/**
	 * Enable/disable momentum scrolling.
	 * Works only with `touchScroll`.
	 * If not specified, `true`.
	 *
	 * 慣性スクロールを有効にするか。
	 * `touchScroll` の時のみ有効。
	 * 省略された場合、真。
	 */
	momentumScroll?: boolean;

	/**
	 * Inset the scollbars or not.
	 * If `true`, the scrollbars are shown inside the entity's rectangle defined by `this.width` and `this.height`.
	 * Note when this value is `false`, this entity renders outside of the rectangle.
	 * If not specified, `false`.
	 *
	 * スクロールバーをエンティティ矩形の内側に描くか否か。
	 * 真である場合、スクロールバーはエンティティ矩形(`this.width` と `this.height` の矩形)の内側に描かれる。
	 * この値が偽である場合、このエンティティの描画内容はエンティティ矩形を「はみ出す」ことに注意。
	 * 省略された場合、偽。
	 */
	insetBars?: boolean;

	// (For future extension...)
	// fuzzyDirectionLock?: boolean;
}

export module EasingFunction {
	export function Linear(r: number): number { return r; }
	export function EaseInQuad(r: number): number { return (r * r); }
	export function EaseOutQuad(r: number): number { return (-r * (r - 2)); }
	export function EaseInOutQuad(r: number): number {
		return ((r < 0.5) ? r * r * 2 : -((r * 2 - 1) * (r * 2 - 3) - 1) / 2);
	}
	export function EaseInQubic(r: number): number { return (r * r * r); }
	export function EaseOutQubic(r: number): number { return (((r - 1) * (r - 1) * (r - 1) + 1)); }
	export function EaseInOutQubic(r: number): number {
		return ((r < 0.5) ? r * r * r * 4 : ((r * 2 - 2) * (r * 2 - 2) * (r * 2 - 2) + 2) / 2);
	}
	export function EaseInSine(r: number): number { return (-Math.cos(r * (Math.PI / 2)) + 1); }
	export function EaseOutSine(r: number): number { return (Math.sin(r * (Math.PI / 2))); }
	export function EaseInOutSine(r: number): number { return (-(Math.cos(Math.PI * r) - 1) / 2); }
};

/**
 * The entity class that provide scrolling/clipping.
 * Any children of `this.content` are clipped and able to be scrolled by the scrollbars.
 *
 * スクロール・クリッピング機能を提供するエンティティ。
 * `this.content` の子孫エンティティはクリッピングされ、スクロールバーでスクロールできる。
 */
export class Scrollable extends g.E {
	/**
	 * Easing functions for scroll functions (e.g. `scrollToX()`)
	 *
	 * スクロール関数(`scrollToX()` など)のためのイージング関数群。
	 */
	static Easing: typeof EasingFunction = EasingFunction;

	// TODO images should be shared to reduce memory consumption? but how? multiple game instances should be considered.
	private _bgImage: g.Surface;
	private _barImage: g.Surface;

	private _isVertical: boolean;
	private _isHorizontal: boolean;
	private _touchScroll: boolean;
	private _momentumScroll: boolean;
	private _insetBars: boolean;

	private _extraDrawSize: number;
	private _extraDrawOffsetX: number;
	private _extraDrawOffsetY: number;

	private _contentContainer: ScrolledContentContainer;
	private _horizontalBar: Scrollbar;
	private _verticalBar: Scrollbar;

	private _surface: g.Surface;
	private _renderer: g.Renderer;
	private _isCached: boolean;
	private _renderedCamera: g.Camera;

	private _renderOffsetX: number;
	private _renderOffsetY: number;
	private _contentBoundingWidth: number;
	private _contentBoundingHeight: number;
	private _isUpdateBoundingRectRequested: boolean;
	private _isUpdateContentScrollRequested: boolean;
	private _isUpdateScrollbarRequested: boolean;
	private _isFlushRequested: boolean;
	private _lastNotifiedVerticalRate: number;
	private _lastNotifiedHorizontalRate: number;
	private _deltaX: number;
	private _deltaY: number;
	private _apiRequestedOffsetX: number;
	private _apiRequestedOffsetY: number;
	private _beforeWidth: number;
	private _beforeHeight: number;
	private _frameTasks: FrameTaskData[];
	private _momentumBuffer: MomentumBuffer;

	/**
	 * The content root entity.
	 * Any children of this entity are clipped by the rectangle of `this` (defined by `this.width` and `this.height`).
	 *
	 * コンテンツルートとなるエンティティ。
	 * コンテンツルートの子孫の表示はクリッピングされ、スクロールできるようになる。
	 * そのクリッピング範囲は `this.width` と `this.height` で定義される。
	 */
	get content() { return this._contentContainer.content(); }

	/**
	 * The horizontal scrollbar.
	 *
	 * 横スクロールバーエンティティ。
	 */
	get horizontalBar() { return this._horizontalBar; }

	/**
	 * The vertical scrollbar.
	 *
	 * 縦スクロールバーエンティティ。
	 */
	get verticalBar() { return this._verticalBar; }

	/**
	 * The horizontal scroll offset in pixels.
	 * A positive number or zero.
	 *
	 * 横方向のスクロールオフセット(ピクセル)。
	 * 0または正の数。
	 */
	get scrollOffsetX() { return -this._contentContainer.offsetContainer().x; }

	/**
	 * The vertical scroll offset in pixels.
	 * A positive number or zero.
	 *
	 * 縦方向のスクロールオフセット(ピクセル)。
	 * 0または正の数。
	 */
	get scrollOffsetY() { return -this._contentContainer.offsetContainer().y; }

	/**
	 * Assign the horizontal scroll offset in pixels.
	 *
	 * 横方向のスクロールオフセット(ピクセル)を設定する。
	 * @param x The horizontal scroll offset in pixels. 横スクロールオフセット。
	 */
	set scrollOffsetX(x: number) {
		this._apiRequestedOffsetX = -x;
		this._requestUpdateContentScroll();
		this._requestUpdateScrollbar();
	}

	/**
	 * Assign the vertical scroll offset in pixels.
	 *
	 * 縦方向のスクロールオフセット(ピクセル)を設定する。
	 * @param y The vertical scroll offset in pixels. 縦スクロールオフセット。
	 */
	set scrollOffsetY(y: number) {
		this._apiRequestedOffsetY = -y;
		this._requestUpdateContentScroll();
		this._requestUpdateScrollbar();
	}

	/**
	 * Create an instance of `Scrollable`.
	 *
	 * `Scrollable` のインスタンスを生成する。
	 */
	constructor(param: ScrollableParameterObject) {
		super(param);
		this._bgImage = null;
		this._barImage = null;
		this._isVertical = !!param.vertical;
		this._isHorizontal = !!param.horizontal;
		this._touchScroll = !!param.touchScroll;
		this._momentumScroll = (param.momentumScroll != null) ? param.momentumScroll : true;
		this._insetBars = !!param.insetBars;

		this._extraDrawSize = 100;
		this._extraDrawOffsetX = this._extraDrawSize;
		this._extraDrawOffsetY = this._extraDrawSize;

		this._contentContainer = new ScrolledContentContainer({ scene: param.scene, parent: this });
		this._horizontalBar = new NullScrollbar({ scene: param.scene, parent: this });
		this._verticalBar = null;

		if (param.vertical === true || param.horizontal === true) {
			this._bgImage = createDefaultScrollbarImage(param.scene.game, 7, "rgba(255, 255, 255, 0.2)", 4, "rgba(218, 218, 218, 0.5)");
			this._barImage = createDefaultScrollbarImage(param.scene.game, 7, "rgba(255, 255, 255, 0.5)", 4, "rgba(164, 164, 164, 0.7)");
		}

		this._verticalBar =
			(param.vertical === true) ? new NinePatchVerticalScrollbar({ scene: param.scene, bgImage: this._bgImage, image: this._barImage }) :
			(param.vertical) ? param.vertical :
			new NullScrollbar({ scene: param.scene });
		this._verticalBar.x = this._insetBars ? this.width - this._verticalBar.width : this.width;
		this.append(this._verticalBar);
		this._verticalBar.onChangeBarPositionRate.add(this._handleOnChangeVerticalPositionRate, this);
		this._horizontalBar =
			(param.horizontal === true) ? new NinePatchHorizontalScrollbar({ scene: param.scene, bgImage: this._bgImage, image: this._barImage }) :
			(param.horizontal) ? param.horizontal :
			new NullScrollbar({ scene: param.scene });
		this._horizontalBar.y = this._insetBars ? this.height - this._horizontalBar.height : this.height;
		this.append(this._horizontalBar);
		this._horizontalBar.onChangeBarPositionRate.add(this._handleOnChangeHorizontalPositionRate, this);

		this._surface = null;
		this._renderer = null;
		this._isCached = false;
		this._renderedCamera = null;
		this._renderOffsetX = 0;
		this._renderOffsetY = 0;
		this._contentBoundingWidth = 0;
		this._contentBoundingHeight = 0;
		this._isUpdateBoundingRectRequested = false;
		this._isUpdateContentScrollRequested = false;
		this._isUpdateScrollbarRequested = false;
		this._isFlushRequested = false;
		this._lastNotifiedVerticalRate = null;
		this._lastNotifiedHorizontalRate = null;
		this._deltaX = 0;
		this._deltaY = 0;
		this._apiRequestedOffsetX = null;
		this._apiRequestedOffsetY = null;
		this._beforeWidth = param.width;
		this._beforeHeight = param.height;
		this._frameTasks = [];
		this._momentumBuffer = new MomentumBuffer(3);

		this._contentContainer.onContentModified.add(this._handleContentModified, this);
		if (this._touchScroll) {
			this.touchable = true;
			this.pointDown.add(this._handlePointDown, this);
			this.pointMove.add(this._handlePointMove, this);
			this.pointUp.add(this._handlePointUp, this);
		}
		this._requestUpdateBoundingRect();
		this._requestUpdateScrollbar();
	}

	/**
	 * Destroy the entity.
	 *
	 * このエンティティを破棄する。
	 */
	destroy(): void {
		this._contentContainer = null;  // destroy() called as destroying this.children.
		this._horizontalBar = null;     // ditto.
		this._verticalBar = null;       // ditto.
		if (this._surface) {
			this._surface.destroy();
			this._surface = null;
		}
		this._renderer = null;
		this._isCached = false;
		this._renderedCamera = null;
		this._renderOffsetX = 0;
		this._renderOffsetY = 0;

		if (this._bgImage) {
			this._bgImage.destroy();
			this._bgImage = null;
		}
		if (this._barImage) {
			this._barImage.destroy();
			this._barImage = null;
		}

		super.destroy();
	}

	/**
	 * Returns the horizontal scroll offset in percentage.
	 *
	 * 横スクロールオフセットをパーセントで返す。
	 */
	getScrollOffsetPercentX(): number {
		this._flushModification();
		const w = this._contentBoundingWidth - this.width;
		return (w > 0) ? 100 * this.scrollOffsetX / w : 0;
	}

	/**
	 * Set the horizontal scroll offset in percentage.
	 *
	 * 横スクロールオフセットをパーセントで設定する。
	 * @param perX  the horizontal scroll offset (in percent) 横スクロールオフセット(パーセント)
	 */
	setScrollOffsetPercentX(perX: number): void {
		this._flushModification();
		const w = Math.max(this._contentBoundingWidth - this.width, 0);
		this.scrollOffsetX = Math.floor(perX * w / 100);
	}

	/**
	 * Returns the vertical scroll offset in percentage.
	 *
	 * 縦スクロールオフセットをパーセントで返す。
	 */
	getScrollOffsetPercentY(): number {
		this._flushModification();
		const h = this._contentBoundingHeight - this.height;
		return (h > 0) ? 100 * this.scrollOffsetY / h : 0;
	}

	/**
	 * Set the vertical scroll offset in percentage.
	 *
	 * 縦スクロールオフセットをパーセントで設定する。
	 * @param perY  the vertical scroll offset (in percent) 縦スクロールオフセット(パーセント)
	 */
	setScrollOffsetPercentY(perY: number): void {
		this._flushModification();
		const h = Math.max(this._contentBoundingHeight - this.height, 0);
		this.scrollOffsetY = Math.floor(perY * h / 100);
	}

	/**
	 * Scroll to the specified horizontal offset.
	 *
	 * 指定の横スクロール位置へスクロールする。
	 * @param x  the horizontal scroll offset.  横スクロール位置。
	 * @param duration  the duration to complete scroll.  スクロール時間。
	 * @param easing  the easing function. (e.g. Scrollable.Easing.Linear)  イージング関数。
	 */
	scrollToX(x: number, duration: number, easing?: (rate: number) => number): void {
		this._addFrameTask({ type: "scroll", origX: -this._contentContainer.offsetContainer().x, x, duration, easing, count: 0 });
	}

	/**
	 * Scroll to the specified vertical offset.
	 *
	 * 指定の縦スクロール位置へスクロールする。
	 * @param x  the vertical scroll offset.  縦スクロール位置。
	 * @param duration  the duration to complete scroll.  スクロール時間。
	 * @param easing  the easing function. (e.g. Scrollable.Easing.Linear)  イージング関数。
	 */
	scrollToY(y: number, duration: number, easing?: (rate: number) => number): void {
		this._addFrameTask({ type: "scroll", origY: -this._contentContainer.offsetContainer().y, y, duration, easing, count: 0 });
	}

	/**
	 * Scroll to the specified horizontal offset (in percentage).
	 *
	 * 指定の横スクロール位置(パーセント指定)へスクロールする。
	 * @param x  the horizontal scroll offset in percentage.  横スクロール位置(パーセント)。
	 * @param duration  the duration to complete scroll.  スクロール時間。
	 * @param easing  the easing function. (e.g. Scrollable.Easing.Linear)  イージング関数。
	 */
	scrollToPercentX(perX: number, duration: number, easing?: (rate: number) => number): void {
		this._addFrameTask({ type: "scroll", origX: -this._contentContainer.offsetContainer().x, perX, duration, easing, count: 0 });
	}

	/**
	 * Scroll to the specified vertical offset (in percentage).
	 *
	 * 指定の縦スクロール位置(パーセント指定)へスクロールする。
	 * @param x  the vertical scroll offset in percentage.  縦スクロール位置(パーセント)。
	 * @param duration  the duration to complete scroll.  スクロール時間。
	 * @param easing  the easing function. (e.g. Scrollable.Easing.Linear)  イージング関数。
	 */
	scrollToPercentY(perY: number, duration: number, easing?: (rate: number) => number): void {
		this._addFrameTask({ type: "scroll", origY: -this._contentContainer.offsetContainer().y, perY, duration, easing, count: 0 });
	}

	/**
	 * Render the entity.
	 * Called by the engine implicitly. No need to call this directly.
	 *
	 * このエンティティを描画する。
	 * このメソッドはエンジンによって暗黙に呼び出される。直接呼び出す必要はない。
	 */
	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {
		if (this._renderedCamera !== camera) {
			this._isCached = false;
			this._renderedCamera = camera;
		}
		if (!this._isCached)
			this._renderCache(camera);
		if (this.children) {
			const children = this.children;  // NOTE: Not cloned. Will break if modified while rendering
			for (let i = 0; i < children.length; ++i) {
				if (children[i] !== this._contentContainer) {
					children[i].render(renderer, camera);
					continue;
				}
				if (this._surface && this.width > 0 && this.height > 0) {
					const srcX = this._extraDrawOffsetX - this._renderOffsetX;
					const srcY = this._extraDrawOffsetY - this._renderOffsetY;
					renderer.drawImage(this._surface, srcX, srcY, this.width, this.height, 0, 0);
				}
			}
		}
		return false;
	}

	/**
	 * Notify the modfication on this entity to the engine.
	 *
	 * このエンティティへの変更をエンジンに通知する。
	 */
	modified(isBubbling?: boolean): void {
		if (isBubbling)
			this._isCached = false;

		let sizeChanged = false;
		if (this.width !== this._beforeWidth) {
			sizeChanged = true;
			this._beforeWidth = this.width;
			if (this._verticalBar) {
				this._verticalBar.x = this._insetBars ? this.width - this._verticalBar.width : this.width;
				this._verticalBar.modified();
			}
		}
		if (this.height !== this._beforeHeight) {
			sizeChanged = true;
			this._beforeHeight = this.height;
			if (this._horizontalBar) {
				this._horizontalBar.y = this._insetBars ? this.height - this._horizontalBar.height : this.height;
				this._horizontalBar.modified();
			}
		}
		if (sizeChanged) {
			this._requestUpdateContentScroll();
			this._requestUpdateScrollbar();
		}

		super.modified(isBubbling);
	}

	/**
	 * Check if the point may hit something.
	 * Called by the engine implicitly. No need to call this directly.
	 *
	 * ある地点がヒットテストに反応しうるかどうかをチェックする。
	 * このメソッドはエンジンによって暗黙に呼び出される。直接呼び出す必要はない。
	 */
	shouldFindChildrenByPoint(point: g.CommonOffset) {
		const w = this.width + (this._insetBars ? 0 : this._verticalBar.width);
		const h = this.height + (this._insetBars ? 0 : this._horizontalBar.height);
		return (0 <= point.x && point.x < w) && (0 <= point.y && point.y < h);
	}

	private _addFrameTask(task: FrameTaskData): void {
		this._frameTasks.push(task);
		if (this._frameTasks.length === 1) {
			// use _contentContainer to hide the handler from users.
			this._contentContainer.update.add(this._onUpdate, this);
		}
	}

	private _cancelFrameTask(type: string): void {
		for (let i = 0; i < this._frameTasks.length; ++i) {
			const t = this._frameTasks[i];
			if (t.type === type)
				t.done = true;
		}
	}

	private _onUpdate(): void {
		// TODO no need to use a queue?
		// TODO need callback that notifies done for scroll APIs?
		for (let i = 0; i < this._frameTasks.length; ++i) {
			const t = this._frameTasks[i];
			if (t.done)
				this._frameTasks.splice(i, 1);
			++t.count;
			switch (t.type) {
			case "momentum":
				const s = Math.pow(0.9, t.count);
				const d = { x: t.x * s, y: t.y * s };
				t.done = (!this._isHorizontal || Math.abs(d.x) < 0.1) && (!this._isVertical || Math.abs(d.y) < 0.1);
				this._addScrollDelta(d);
				break;
			case "scroll":
				this._flushModification();
				const progress = Math.min(t.count * 1000 / (t.duration * this.scene.game.fps), 1);
				const ratio = t.easing ? t.easing(progress) : progress;
				if (t.x != null || t.perX != null) {
					const destX = (t.x != null) ? t.x : t.perX * Math.max(this._contentBoundingWidth - this.width, 0) / 100;
					const nextX = t.origX + ratio * (destX - t.origX);
					this.scrollOffsetX = nextX;
				}
				if (t.y != null || t.perY != null) {
					const destY = (t.y != null) ? t.y : t.perY * Math.max(this._contentBoundingHeight - this.height, 0) / 100;
					const nextY = t.origY + ratio * (destY - t.origY);
					this.scrollOffsetY = nextY;
				}
				t.done = (progress === 1);
				break;
			default:
				throw new Error("Scrollable#_onUpdate: never reach");
			}
		}

		if (this._frameTasks.length === 0)
			this._contentContainer.update.remove(this._onUpdate, this);
	}

	private _handleContentModified(): void {
		this._requestUpdateBoundingRect();
	}

	private _handleOnChangeVerticalPositionRate(rate: number): void {
		this._lastNotifiedVerticalRate = rate;
		this._requestUpdateContentScroll();
	}

	private _handleOnChangeHorizontalPositionRate(rate: number): void {
		this._lastNotifiedHorizontalRate = rate;
		this._requestUpdateContentScroll();
	}

	private _handlePointDown(ev: g.PointDownEvent): void {
		this._cancelFrameTask("momentum");
		this._momentumBuffer.reset();
	}

	private _handlePointMove(ev: g.PointMoveEvent): void {
		this._addScrollDelta(ev.prevDelta);
		this._momentumBuffer.addDelta(ev.prevDelta);
	}

	private _handlePointUp(ev: g.PointUpEvent): void {
		if (this._momentumScroll) {
			const d = this._momentumBuffer.average();
			if ((this._isHorizontal && Math.abs(d.x) > 2) || (this._isVertical && Math.abs(d.y) > 2))
				this._addFrameTask({ type: "momentum", x: d.x, y: d.y, count: 0 });
		}
	}

	private _addScrollDelta(delta: g.CommonOffset): void {
		this._deltaX += delta.x;
		this._deltaY += delta.y;
		this._requestUpdateScrollbar();
		this._requestUpdateContentScroll();
		this.modified();
	}

	private _requestUpdateBoundingRect(): void {
		if (this._isUpdateBoundingRectRequested) return;
		this._isUpdateBoundingRectRequested = true;
		this._requestFlushModification();
	}

	private _requestUpdateScrollbar(): void {
		if (this._isUpdateScrollbarRequested) return;
		this._isUpdateScrollbarRequested = true;
		this._requestFlushModification();
	}

	private _requestUpdateContentScroll(): void {
		if (this._isUpdateContentScrollRequested) return;
		this._isUpdateContentScrollRequested = true;
		this._requestFlushModification();
	}

	private _requestFlushModification(): void {
		if (this._isFlushRequested) return;
		this._isFlushRequested = true;

		// Ugh! A dirty hack to flush all changes only once a frame, after all events consumed.
		// We should not depend on the rendering phase (which is also performed once a frame) because it may be skipped.
		this.scene.game._callSceneAssetHolderHandler({
			callHandler: () => {
				if (this.destroyed()) return;  // may be destroyed... (since the scene may be dropped here...)
				this._flushModification();
			}
		} as any);
	}

	private _flushModification(): void {
		if (!this._isFlushRequested) {
			// guard for excessive flush (e.g. caused by getScrollOffsetPercentX() following modification)
			return;
		}
		this._isFlushRequested = false;
		let boundingRectChanged = false;
		if (this._isUpdateBoundingRectRequested) {
			this._isUpdateBoundingRectRequested = false;
			boundingRectChanged = this._updateBoundingRect();
		}
		if (boundingRectChanged || this._isUpdateContentScrollRequested) {
			this._isUpdateContentScrollRequested = false;
			this._updateContentScroll();
		}
		if (boundingRectChanged || this._isUpdateScrollbarRequested) {
			this._isUpdateScrollbarRequested = false;
			this._updateScrollBar();
		}
	}

	private _updateBoundingRect(): boolean {
		const size = this._calculateBoundingRectSize();
		let changed = false;
		if (this._contentBoundingWidth !== size.width) {
			this._contentBoundingWidth = size.width;
			changed = true;
		}
		if (this._contentBoundingHeight !== size.height) {
			this._contentBoundingHeight = size.height;
			changed = true;
		}
		return changed;
	}

	private _calculateBoundingRectSize(): g.CommonSize {
		// Ugh! This class ignores cameras.
		// The dimensions of the scrollable area are determined by the bounding rect which depends on cameras.
		// This means the same operation on scrollable ares may be interpreted in multiple ways...
		// Calling `calculateBoundingRect()` here, outside of the rendering phase, is valid as we ignore cameras.
		const content = this._contentContainer.content();
		const br = content.calculateBoundingRect();
		const width = br.right - br.left;
		const height = br.bottom - br.top;
		return { width, height };
	}

	private _updateContentScroll(): void {
		const offsetContainer = this._contentContainer.offsetContainer();
		const vrate = this._lastNotifiedVerticalRate;
		const hrate = this._lastNotifiedHorizontalRate;
		const dx = this._deltaX;
		const dy = this._deltaY;
		const ox = this._apiRequestedOffsetX;
		const oy = this._apiRequestedOffsetY;
		this._lastNotifiedVerticalRate = null;
		this._lastNotifiedHorizontalRate = null;
		this._deltaX = 0;
		this._deltaY = 0;
		this._apiRequestedOffsetX = null;
		this._apiRequestedOffsetY = null;

		if (this._isHorizontal) {
			const x0 = offsetContainer.x;
			const x1base = (ox != null) ? ox : x0;
			const x1raw = (dx !== 0) ? (x1base + dx) : ((hrate != null) ? (-hrate * this._contentBoundingWidth) : x1base);
			const x1 = Math.max(Math.min(x1raw, 0), Math.min(this.width - this._contentBoundingWidth, 0));
			offsetContainer.x = x1;
			this._renderOffsetX += (offsetContainer.x - x0);
		}
		if (this._isVertical) {
			const y0 = offsetContainer.y;
			const y1base = (oy != null) ? oy : y0;
			const y1raw = (dy !== 0) ? (y1base + dy) : ((vrate != null) ? (-vrate * this._contentBoundingHeight) : y1base);
			const y1 = Math.max(Math.min(y1raw, 0), Math.min(this.height - this._contentBoundingHeight, 0));
			offsetContainer.y = y1;
			this._renderOffsetY += y1 - y0;
		}
		if (Math.abs(this._renderOffsetX) > this._extraDrawSize ||
				Math.abs(this._renderOffsetY) > this._extraDrawSize) {
			this._isCached = false;
		}
	}

	private _updateScrollBar(): void {
		// Is calling modified() in the flushSceneChangeRequests phase valid...?
		const offsetContainer = this._contentContainer.offsetContainer();
		this._horizontalBar.setBarProperties(-offsetContainer.x / this._contentBoundingWidth, this._contentBoundingWidth, this.width);
		this._verticalBar.setBarProperties(-offsetContainer.y / this._contentBoundingHeight, this._contentBoundingHeight, this.height);
	}

	private _renderCache(camera?: g.Camera): void {
		const surfaceWidth = Math.ceil(this.width + 2 * this._extraDrawSize);
		const surfaceHeight = Math.ceil(this.height + 2 * this._extraDrawSize);
		const isNew = !this._surface || this._surface.width < surfaceWidth || this._surface.height < surfaceHeight;
		if (isNew) {
			if (this._surface && !this._surface.destroyed())
				this._surface.destroy();
			this._surface = this.scene.game.resourceFactory.createSurface(surfaceWidth, surfaceHeight);
			this._renderer = this._surface.renderer();
		}
		this._renderer.begin();
		if (!isNew)
			this._renderer.clear();
		this._renderer.save();
		this._renderer.translate(this._extraDrawOffsetX, this._extraDrawOffsetY);
		this._contentContainer.render(this._renderer, camera);
		this._renderer.restore();
		this._renderOffsetX = 0;
		this._renderOffsetY = 0;
		this._renderer.end();
		this._isCached = true;
	}
}
