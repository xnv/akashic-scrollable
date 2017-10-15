export interface ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	setBarProperties(posRate?: number | null, contentlength?: number | null, viewLength?: number | null): void;
}

export type ScrollbarLike = g.E & ScrollbarOperations;
