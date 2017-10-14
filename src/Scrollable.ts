
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
	vertical?: boolean;

	/**
	 * Enable/disable horizontal scrolling.
	 * If not specified, `false` .
	 *
	 * 縦方向のスクロールを有効にするか。
	 * 省略された場合、偽。
	 */
	horizontal?: boolean;

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
	barImage?: g.Asset | g.Surface | "default";

	// inertialScroll?: boolean;  // | InertialScrollPolicy
	// fuzzyDirectionLock?: boolean;  // should be considered as a future extension?
}

export class Scrollable extends g.E {
	private _vertical: boolean;
	private _horizontal: boolean;
	private _touchScroll: boolean;
	private _extraDrawSize: number;
	private _extraDrawOffsetX: number;
	private _extraDrawOffsetY: number;
	private _contentContainer: ScrolledContentContainer;
	private _horizontalBar: g.E;
	private _verticalBar: g.E;

	private _surface: g.Surface;
	private _renderer: g.Renderer;
	private _isCached: boolean;
	private _renderedCamera: g.Camera

	private _renderOffsetX: number;
	private _renderOffsetY: number;
	private _contentBoundingWidth: number;
	private _contentBoundingHeight: number;
	private _isUpdateScrollBarRequested: boolean;
	private _deltaX: number;
	private _deltaY: number;

	get content() {
		return this._contentContainer.content();
	}

	get horizontalBar() {
		return this._horizontalBar;
	}

	get verticalBar() {
		return this._horizontalBar;
	}

	// TODO getter/setter in percent

	// get scrollOffsetY() {
	// 	return this._scrollOffsetY;
	// }

	// set scrollOffsetY(y: number) {
	// 	return this._scrollOffsetY = y;
	// }

	constructor(param: ScrollableParameterObject) {
		super(param);
		this._vertical = !!param.vertical;
		this._horizontal = !!param.horizontal;
		this._touchScroll = !!param.touchScroll

		this._extraDrawSize = 10;
		this._extraDrawOffsetX = this._extraDrawSize;
		this._extraDrawOffsetY = this._extraDrawSize;
		this._contentContainer = new ScrolledContentContainer({ scene: param.scene, parent: this });
		this._horizontalBar = new g.E({ scene: param.scene, parent: this });
		this._verticalBar = new g.E({ scene: param.scene, parent: this });
		this._surface = null;
		this._renderer = null;
		this._isCached = false;
		this._renderedCamera = null;
		this._renderOffsetX = 0;
		this._renderOffsetY = 0;
		this._contentBoundingWidth = 0;
		this._contentBoundingHeight = 0;
		this._isUpdateScrollBarRequested = false;
		this._deltaX = 0;
		this._deltaY = 0;

		this._contentContainer.onContentModified.add(this._handleContentModified, this);

		if (this._touchScroll) {
			this.touchable = true;
			this.pointMove.add(this._handlePointMove, this);
		}
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

	private _requestUdpateScrollBar(): void {
		if (this._isUpdateScrollBarRequested) return;
		this._isUpdateScrollBarRequested = true;

		// Ugh! A dirty hack to update the bounding rect only once a frame, after all events consumed.
		// We should not depend on the rendering phase (which is also performed once a frame) because it may be skipped.
		this.scene.game._callSceneAssetHolderHandler({
			callHandler: () => {
				if (this.destroyed()) return;  // may be destroyed... (since the scene may be dropped here...)
				this._isUpdateScrollBarRequested = false;

				// Ugh! This class ignores cameras.
				// The dimensions of the scrollable area are determined by the bounding rect which depends on cameras.
				// This means the same operation on scrollable ares may be interpreted in multiple ways...
				// Calling `calculateBoundingRect()` here, outside of the rendering phase, is valid as we ignore cameras.
				const content = this._contentContainer.content();
				const br = content.calculateBoundingRect();
				this._contentBoundingWidth = br.right - br.left;
				this._contentBoundingHeight = br.bottom - br.top;

				this._flushScrollDelta();
				this._updateScrollBar();
			}
		} as any);
	}

	private _handleContentModified(): void {
		this._requestUdpateScrollBar();
	}

	private _handlePointMove(ev: g.PointMoveEvent): void {
		this._deltaX += ev.prevDelta.x;
		this._deltaY += ev.prevDelta.y;
		this._requestUdpateScrollBar();
		this.modified();
	}

	private _flushScrollDelta(): void {
		const offsetContainer = this._contentContainer.offsetContainer();
		const dx = this._deltaX;
		const dy = this._deltaY;
		this._deltaX = 0;
		this._deltaY = 0;
		if (this._horizontal) {
			const x0 = offsetContainer.x;
			offsetContainer.x = Math.max(Math.min(x0 + dx, 0), Math.min(this.width - this._contentBoundingWidth, 0));
			this._renderOffsetX += (offsetContainer.x - x0);
		}
		if (this._vertical) {
			const y0 = offsetContainer.y;
			offsetContainer.y = Math.max(Math.min(y0 + dy, 0), Math.min(this.height - this._contentBoundingHeight, 0));
			this._renderOffsetY += (offsetContainer.y - y0);
		}
		if (Math.abs(this._renderOffsetX) > this._extraDrawSize ||
				Math.abs(this._renderOffsetY) > this._extraDrawSize) {
			this._isCached = false;
		}
	}

	private _updateScrollBar(): void {
		// Is calling modified() in the flushSceneChangeRequests phase valid...?
		const offsetContainer = this._contentContainer.offsetContainer();
		const x = offsetContainer.x;
		const y = offsetContainer.y;
		const outerWidth = this.width;
		const outerHeight = this.height;
		const bx = Math.round(outerWidth * x / this._contentBoundingWidth);
		const by = Math.round(outerHeight * y / this._contentBoundingHeight);
		const bw = Math.round(outerWidth * outerWidth / this._contentBoundingWidth);
		const bh = Math.round(outerHeight * outerHeight / this._contentBoundingWidth);
		if (this._horizontalBar.x !== bx) {
			this._horizontalBar.x = bx;
			this._horizontalBar.modified();
		}
		if (this._horizontalBar.width !== bw) {
			this._horizontalBar.width = bw;
			this._horizontalBar.modified();
		}
		if (this._verticalBar.y !== by) {
			this._verticalBar.y = by;
			this._verticalBar.modified();
		}
		if (this._verticalBar.height !== bh) {
			this._verticalBar.height = bh;
			this._verticalBar.modified();
		}
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
