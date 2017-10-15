import { Scrollable } from "./Scrollable";

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({game: g.game});
	scene.loaded.add(() => {
		const scr = new Scrollable({
			scene: scene,
			vertical: true,
			horizontal: true,
			touchScroll: true,
			width: 100,
			height: 100,
			x: 50,
			y: 50
		});

		var red = new g.FilledRect({
			scene: scene,
			parent: scr.content,
			cssColor: "#ff0000",
			x: 0,
			y: 0,
			width: 32,
			height: 32
		});

		scene.setInterval(function () {
			red.x = (red.x === 0) ? 300 : 0;
			red.modified();
		}, 2000);
		scene.setInterval(function () {
			scr.width = (scr.width === 100) ? 350 : 100;
			scr.modified();
		}, 4000);

		var blue = new g.FilledRect({
			scene: scene,
			parent: scr.content,
			cssColor: "#0000ff",
			x: 50,
			y: 90,
			width: 32,
			height: 32,
			touchable: true
		});
		blue.pointDown.add(function () {
			blue.cssColor = "silver";
			blue.modified();
		});
		blue.pointMove.add(function (e: g.PointMoveEvent) {
			blue.x += e.prevDelta.x;
			blue.y += e.prevDelta.y;
			blue.modified();
		});
		blue.pointUp.add(function () {
			blue.cssColor = "blue";
			blue.modified();
		});

		new g.FilledRect({
			scene: scene,
			parent: scr.content,
			cssColor: "#ff00ff",
			x: 25,
			y: 290,
			width: 32,
			height: 32
		});
		new g.FilledRect({
			scene: scene,
			parent: scr.content,
			cssColor: "#00ff00",
			x: 150,
			y: 280,
			width: 32,
			height: 32
		});

		scene.append(scr);
	});

	g.game.pushScene(scene);
}

export = main;
