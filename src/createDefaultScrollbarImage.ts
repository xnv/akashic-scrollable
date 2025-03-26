/**
 * Draw a circle.
 * Since Akashic Engine does not provide the means to draw a circle, this function draws a rough circle by 1-pixel lines.
 *
 * 円を描画する。
 * Akashic Engine は円の描画をサポートしていないため、この関数は1ピクセルの線でラフな円を描く。
 * @param rendr Renderer. レンダラ。
 * @param centerX The x position of the center. 中心のX座標。
 * @param centerY The y position of the center. 中心のY座標。
 * @param radius The radius. 半径。
 * @param cssColor The color to be drawn. 色。
 */
export function drawCircle(rendr: g.Renderer, centerX: number, centerY: number, radius: number, cssColor: string) {
	for (let y = centerY - radius; y <= centerY + radius; ++y) {
		const w = radius * Math.cos(Math.asin((centerY - y) / radius));
		rendr.fillRect(centerX - w, y, 2 * w, 1, cssColor);
	}
}

/**
 * Create a surface used as images of the default scrollbar.
 *
 * デフォルトのスクロールバーで使用される画像の `g.Surface` を生成する。
 * @param game Game
 * @param outerRadius the radius of the outer circle. 外側の円の半径。
 * @param outerCssColor the color of the outer circle. 外側の円の色。
 * @param innerRadius the radius of the inner circle. 内側の円の半径。
 * @param innerCssColor the color of the inner circle. 内側の円の色。
 */
export function createDefaultScrollbarImage(
	game: g.Game,
	outerRadius: number, outerCssColor: string,
	innerRadius?: number, innerCssColor?: string
): g.Surface {
	const s = game.resourceFactory.createSurface(outerRadius * 2 + 1, outerRadius * 2 + 1);
	const r = s.renderer();
	r.begin();
	drawCircle(r, outerRadius, outerRadius, outerRadius, outerCssColor);
	if (innerRadius && innerCssColor)
		drawCircle(r, outerRadius, outerRadius, innerRadius, innerCssColor);
	r.end();
	return s;
}
