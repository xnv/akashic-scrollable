import { describe, expect, it } from "vitest";
import { GameContext } from "@akashic/headless-akashic";
import * as g from "@akashic/akashic-engine";

// Ugh! Dirty and essentially wrong way but unavoidable...
// ref. https://github.com/akashic-games/headless-akashic?tab=readme-ov-file#g-%E3%81%8A%E3%82%88%E3%81%B3-ggame-%E3%81%AE%E8%A7%A3%E6%B1%BA
// biome-ignore lint/suspicious/noExplicitAny: hard to type...
globalThis.g = g as any;

describe("Scrollable", async () => {
    // Ugh! Use dynamic import() to wait initializing `g`...
    const { Scrollable } = await import("../../lib/");

    async function prepare() {
        const ctx = new GameContext<3>({});
        const client = await ctx.getGameClient();
        const game = client.game;
        await ctx.advanceEach(game.fps);
        const scene = new client.g.Scene({ game, name: "test-scene" });
        game.pushScene(scene);
        await client.advanceUntil(() => {
            return game.scene()?.name === "test-scene";
        });
        const dispose = () => ctx.destroy();
        return { ctx, client, game, scene, [Symbol.asyncDispose]: dispose };
    }

	it("can be instantiated", async () => {
        await using res = await prepare();
        const { scene } = res;

        const scr = new Scrollable({
            scene,
            width: 120,
            height: 100,
            vertical: true,
            horizontal: true,
            parent: scene,
            x: 10,
            y: 20,
        });
        expect(scr.scene).toBe(scene);
        expect(scr.parent).toBe(scene);
        expect(scr.x).toBe(10);
        expect(scr.y).toBe(20);
        expect(scr.width).toBe(120);
        expect(scr.height).toBe(100);
	});

	it("can be appended entities and scrolled", async () => {
        await using res = await prepare();
        const { ctx, game, scene } = res;

        const scr = new Scrollable({
            scene,
            width: 120,
            height: 100,
            vertical: true,
            horizontal: true,
            parent: scene,
            x: 10,
            y: 20,
        });
        expect(scr.content instanceof g.E).toBe(true);

        const redRect = new g.FilledRect({
            scene,
            cssColor: "red",
            width: 10,
            height: 10,
            x: 400,
            y: 30,
            parent: scr.content
        });

        function accumulatedX(e: g.E): number { return e.x + (e.parent instanceof g.E ? accumulatedX(e.parent) : 0); }
        function accumulatedY(e: g.E): number { return e.y + (e.parent instanceof g.E ? accumulatedY(e.parent) : 0); }

        scr.scrollOffsetX = 300;  // actually sets 290 (300 is out of the horizontal scrollable range)
        scr.scrollOffsetY = 7;  // actually no effect since no vertical scroll area is

        await ctx.advanceEach(game.fps);
        expect(accumulatedX(redRect)).toBe(10 + 400 - 290);
        expect(accumulatedY(redRect)).toBe(20 + 30);
	});

	it("never throws while scene transition", async () => {
        await using res = await prepare();
        const { ctx, client, game, scene } = res;

        const scr = new Scrollable({
            scene,
            width: 120,
            height: 100,
            vertical: true,
            horizontal: true,
            parent: scene,
            x: 10,
            y: 20,
        });
        new g.FilledRect({
            scene,
            cssColor: "red",
            width: 10,
            height: 10,
            x: 400,
            y: 30,
            parent: scr.content
        });

        const nextScene = new client.g.Scene({ game, name: "nextscene" });
        game.replaceScene(nextScene);
        await ctx.advanceEach(game.fps);
        await client.advanceUntil(() => game.scene()?.name === "nextscene");
	});
});
