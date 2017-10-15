import { createDefaultScrollbarImage } from "./createDefaultScrollbarImage";
import { ScrollbarLike, NullScrollbar, DefaultVerticalScrollbar } from "./DefaultScrollbars";

export class ScrolledContent extends g.E {
	onModified: g.Trigger<void>;
	constructor(param: g.EParameterObject) {
		super(param);
		this.onModified = new g.Trigger<void>();
	}
	destroy(): void {
		this.onModified.destroy();
		this.onModified = null;
	}
	modified(isBubbling?: boolean) {
		this.onModified.fire();
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
	}

	offsetContainer(): g.E {
		return this._offsetContainer;
	}

	content(): g.E {
		return this._content;
	}
}

export interface ScrollableParameterObject extends g.EParameterObject {
	/**
	 * Enable/disable vertical scrolling.
	 * If not specified, `false`.
	 *
	 * 縦方向のスクロールを有効にするか。
	 * 省略された場合、偽。
	 */
	vertical?: boolean | ScrollbarLike;

	/**
	 * Enable/disable horizontal scrolling.
	 * If not specified, `false` .
	 *
	 * 縦方向のスクロールを有効にするか。
	 * 省略された場合、偽。
	 */
	horizontal?: boolean; // | ScrollbarLike;

	/**
	 * Enable/disable scrolling by dragging on the entity itself.
	 * If not specified, `false`.
	 *
	 * エンティティ自体のドラッグ操作によるスクロールを有効にするか。
	 * 省略された場合、偽。
	 */
	touchScroll?: boolean;

	/**
	 * The width of the scrollbar.
	 * If not specified, `5`.
	 *
	 * スクロールバーの幅。
	 * 省略された場合、 `5` 。
	 */
	barWidth?: number;

	/**
	 * Inset the scollbars or not.
	 * If `true`, the scrollbars are shown inside the entity's rectangle defined by `this.width` and `this.height`.
	 * Note when this value is `false`, this entity renders outside of the rectangle.
	 * If not specified, `true`.
	 *
	 * スクロールバーをエンティティ矩形の内側に描くか否か。
	 * 真である場合、スクロールバーはエンティティ矩形(`this.width` と `this.height` の矩形)の内側に描かれる。
	 * この値が偽である場合、このエンティティの描画内容はエンティティ矩形を「はみ出す」ことに注意。
	 * 省略された場合、偽。
	 */
	insetBars?: boolean;

	/**
	 * The image of the scrollbar.
	 *
	 */
	barImage?: g.Asset | g.Surface | string;

	// inertialScroll?: boolean;  // | InertialScrollPolicy
	// fuzzyDirectionLock?: boolean;  // as a future extension?
}

export class Scrollable extends g.E {
	// TODO should share? but how? multiple game instances should be considered.
	private _scrollbarBgImage: g.Surface;
	private _scrollbarImage: g.Surface;

	private _isVertical: boolean;
	private _isHorizontal: boolean;
	private _touchScroll: boolean;
	private _insetBars: boolean;
	private _barWidth: number;

	private _extraDrawSize: number;
	private _extraDrawOffsetX: number;
	private _extraDrawOffsetY: number;

	private _contentContainer: ScrolledContentContainer;
	private _horizontalBar: ScrollbarLike;
	private _verticalBar: ScrollbarLike;

	private _surface: g.Surface;
	private _renderer: g.Renderer;
	private _isCached: boolean;
	private _renderedCamera: g.Camera

	private _renderOffsetX: number;
	private _renderOffsetY: number;
	private _contentBoundingWidth: number;
	private _contentBoundingHeight: number;
	private _isUpdateBoundingRectRequested: boolean;
	private _isUpdateContentScrollRequested: boolean;
	private _isUpdateScrollbarRequested: boolean;
	private _isFlushRequested: boolean;
	private _lastNotifiedVerticalRate: number;
	private _deltaX: number;
	private _deltaY: number;

	get content() { return this._contentContainer.content(); }
	get horizontalBar() { return this._horizontalBar; }
	get verticalBar() { return this._verticalBar; }

	// TODO getter/setter in percent

	// get scrollOffsetY() {
	// 	return this._scrollOffsetY;
	// }

	// set scrollOffsetY(y: number) {
	// 	return this._scrollOffsetY = y;
	// }

	constructor(param: ScrollableParameterObject) {
		super(param);
		this._scrollbarBgImage = null;
		this._scrollbarImage = null;
		this._isVertical = !!param.vertical;
		this._isHorizontal = !!param.horizontal;
		this._touchScroll = !!param.touchScroll

		this._extraDrawSize = 10;
		this._extraDrawOffsetX = this._extraDrawSize;
		this._extraDrawOffsetY = this._extraDrawSize;

		this._contentContainer = new ScrolledContentContainer({ scene: param.scene, parent: this });
		this._horizontalBar = new NullScrollbar({ scene: param.scene, parent: this });
		this._verticalBar = null;

		if (param.vertical) {
			if (typeof param.vertical === "object") {
				this._verticalBar = param.vertical;
			} else {
				this._scrollbarBgImage = createDefaultScrollbarImage(param.scene.game, 10, "rgba(255, 255, 255, 0.2)", 7, "rgba(218, 218, 218, 0.5)");
				this._scrollbarImage = createDefaultScrollbarImage(param.scene.game, 10, "rgba(255, 255, 255, 0.7)", 7, "rgba(128, 129, 128, 0.7)");
				this._verticalBar = new DefaultVerticalScrollbar({
					scene: param.scene,
					bgImage: this._scrollbarBgImage,
					image: this._scrollbarImage
				});
			}
		} else {
			this._verticalBar = new NullScrollbar({ scene: param.scene });
		}
		this._verticalBar.x = param.insetBars ? this.width - this._verticalBar.width : this.width;
		this.append(this._verticalBar);
		this._verticalBar.onChangeBarPositionRate.add(this._handleOnChangeVerticalPositionRate, this);

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
		this._deltaX = 0;
		this._deltaY = 0;

		this._contentContainer.onContentModified.add(this._handleContentModified, this);

		if (this._touchScroll) {
			this.touchable = true;
			this.pointMove.add(this._handlePointMove, this);
		}

		this._requestUpdateBoundingRect();
		this._requestUpdateScrollbar();
	}

	// scrollToX(100, 200, "ease-in");

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
		super.destroy();
	}

	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {
		if (this._renderedCamera !== camera) {
			this._isCached = false;
			this._renderedCamera = camera;
		}
		if (!this._isCached)
			this._renderCache(camera);
		if (this.children) {
			var children = this.children;  // NOTE: Not cloned. Will break if modified while rendering
			for (var i = 0; i < children.length; ++i) {
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

	modified(isBubbling?: boolean): void {
		// TODO: check width/height and update scrollbars.
		super.modified(isBubbling);
	}

	private _handleContentModified(): void {
		this._requestUpdateBoundingRect();
	}

	private _handleOnChangeVerticalPositionRate(rate: number): void {
		this._lastNotifiedVerticalRate = rate;
		this._requestUpdateContentScroll();
	}

	private _handlePointMove(ev: g.PointMoveEvent): void {
		this._deltaX += ev.prevDelta.x;
		this._deltaY += ev.prevDelta.y;
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

		// Ugh! A dirty hack to update the bounding rect only once a frame, after all events consumed.
		// We should not depend on the rendering phase (which is also performed once a frame) because it may be skipped.
		this.scene.game._callSceneAssetHolderHandler({
			callHandler: () => {
				if (this.destroyed()) return;  // may be destroyed... (since the scene may be dropped here...)
				this._flushModification();
			}
		} as any);
	}

	private _flushModification(): void {
		this._isFlushRequested = false;
		let boundingRectChanged = false;
		if (this._isUpdateBoundingRectRequested) {
			this._isUpdateBoundingRectRequested = false;
			boundingRectChanged = this._updateBoundingRect();
		}
		if (this._isUpdateContentScrollRequested) {
			this._isUpdateContentScrollRequested = false;
			this._updateContentScroll();
		}
		if (boundingRectChanged || this._isUpdateScrollbarRequested) {
			this._isUpdateScrollbarRequested = false;
			this._updateScrollBar();
		}
	}

	private _updateBoundingRect(): boolean {
		// Ugh! This class ignores cameras.
		// The dimensions of the scrollable area are determined by the bounding rect which depends on cameras.
		// This means the same operation on scrollable ares may be interpreted in multiple ways...
		// Calling `calculateBoundingRect()` here, outside of the rendering phase, is valid as we ignore cameras.
		const content = this._contentContainer.content();
		const br = content.calculateBoundingRect();
		const bw = br.right - br.left;
		const bh = br.bottom - br.top;
		let boundingRectChanged = false;
		if (this._contentBoundingWidth !== bw) {
			this._contentBoundingWidth = bw;
			boundingRectChanged = true;
		}
		if (this._contentBoundingHeight !== bh) {
			this._contentBoundingHeight = bh;
			boundingRectChanged = true;
		}
		return boundingRectChanged;
	}

	private _updateContentScroll(): void {
		const offsetContainer = this._contentContainer.offsetContainer();
		const vrate = this._lastNotifiedVerticalRate;
		const dx = this._deltaX;
		const dy = this._deltaY;
		this._lastNotifiedVerticalRate = null;
		this._deltaX = 0;
		this._deltaY = 0;

		if (this._isHorizontal) {
			const x0 = offsetContainer.x;
			offsetContainer.x = Math.max(Math.min(x0 + dx, 0), Math.min(this.width - this._contentBoundingWidth, 0));
			this._renderOffsetX += (offsetContainer.x - x0);
		}
		if (this._isVertical) {
			const y0 = offsetContainer.y;
			const y1raw = (dy !== 0) ? (y0 + dy) : ((vrate != null) ? (vrate * this.height) : y0);
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