import { Context } from "@xnv/headless-akashic";
import "@xnv/headless-akashic/polyfill";
import { Scrollable } from "../../lib/";

describe("Scrollable", function () {
	function prepareScene(fun: (game: g.Game, scene: g.Scene) => (void | Promise<void>)): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const ctx = new Context();
			ctx.start().then((game: g.Game) => {
				const scene = new g.Scene({ game });
				scene.loaded.add(() => {
					(fun(game, scene) || Promise.resolve()).then(() => {
						ctx.end();
						resolve();
					});
				});
				game.pushScene(scene);
			});
		});
	}

	it("can be instantiated", function (done: DoneFn) {
		prepareScene((game, scene) => {
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
		}).then(done, done.fail);
	});

	it("can be appended entities and scrolled", function (done: DoneFn) {
		prepareScene((game, scene) => {
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

			return new Promise<void>((resolve, reject) => {
				scene.setTimeout(function () {
					expect(accumulatedX(redRect)).toBe(10 + 400 - 290);
					expect(accumulatedY(redRect)).toBe(20 + 30);
					resolve();
				}, 1);
			});
		}).then(done, done.fail);
	});

	it("never throws while scene transition", function (done: DoneFn) {
		prepareScene((game, scene) => {
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
			const redRect = new g.FilledRect({
				scene,
				cssColor: "red",
				width: 10,
				height: 10,
				x: 400,
				y: 30,
				parent: scr.content
			});

			return new Promise<void>((resolve, reject) => {
				scene.setTimeout(function () {
					var nextScene = new g.Scene({ game });
					nextScene.loaded.add(() => resolve());
					game.replaceScene(nextScene);
				}, 1);
			});
		}).then(done, done.fail);
	});
});
