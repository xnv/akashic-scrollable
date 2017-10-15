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

		new g.FilledRect({
			scene: scene,
			parent: scr.content,
			cssColor: "#ff0000",
			x: 0,
			y: 0,
			width: 32,
			height: 32
		});
		new g.FilledRect({
			scene: scene,
			parent: scr.content,
			cssColor: "#0000ff",
			x: 50,
			y: 90,
			width: 32,
			height: 32
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
