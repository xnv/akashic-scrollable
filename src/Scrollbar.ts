/**
 * The operations that any scrollbars must have implementations.
 *
 * スクロールバーが実装を持つ必要がある操作。
 */
export interface ScrollbarOperations {
	/**
	 * The trigger must be `fire()`ed when the scroll position changed.
	 * The argument must be a number in [0, 1].
	 *
	 * スクロール位置が変化した場合、 `fire()` されねばならないトリガー。
	 * その引数は [0, 1] の数値でなければならない。
	 */
	onChangeBarPositionRate: g.Trigger<number>;

	/**
	 * A method called by `Scrollable` when the properties are changed.
	 * The appeareance of the scrollbar must reflect the given properties.
	 *
	 * スクロールバーのプロパティが変化した時、 `Scrollable` から呼び出されるメソッド。
	 * スクロールバーの表示内容は与えられたプロパティを反映せねばならない。
	 * @param posRate the scroll position rate ([0, 1]). スクロールポジション([0, 1] の数値)
	 * @param contentLength the length of the whole scrolled content. スクロールされる内容の長さ。
	 * @param viewLength the length of the displayed area. 表示される範囲の長さ。
	 */
	setBarProperties(posRate: number, contentLength: number, viewLength: number): void;
}

/**
 * The type of scrollbar.
 *
 * スクロールバーの型。
 */
export type Scrollbar = g.E & ScrollbarOperations;
