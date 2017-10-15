
export function drawCircle(rendr: g.Renderer, centerX: number, centerY: number, radius: number, cssColor: string) {
	for (let y = centerY - radius; y <= centerY + radius; ++y) {
		const w = radius * Math.cos(Math.asin((centerY - y) / radius));
		rendr.fillRect(centerX - w, y, 2 * w, 1, cssColor);
	}
}

export function createDefaultScrollbarImage(
	game: g.Game,
	outerRadius: number, outerCssColor: string,
	innerRadius?: number, innerCssColor?: string
): g.Surface {
	const s = game.resourceFactory.createSurface(outerRadius * 2 + 1, outerRadius * 2 + 1);
	const r = s.renderer();
	r.begin();
	drawCircle(r, outerRadius, outerRadius, outerRadius, outerCssColor);
	drawCircle(r, outerRadius, outerRadius, innerRadius, innerCssColor);
	r.end();
	return s;
}
