var Scrollable = require("@xnv/akashic-scrollable").Scrollable;

function main(param) {
	const scene = new g.Scene({game: g.game});
	scene.loaded.add(function() {
		const scrollable = new Scrollable({
			scene: scene,
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			vertical: true,
			horizontal: false
		});
		scene.append(scrollable);

		const redRect = new g.FilledRect({
			scene: scene,
			width: 20,
			height: 20,
			x: 0,
			y: 90,
			cssColor: "red",
			touchable: true
		});
		scrollable.content.append(redRect);

		redRect.pointDown.add(function () {
			const scene = new g.Scene({game: g.game});
			const blue = new g.FilledRect({
				scene: scene,
				width: 20,
				height: 20,
				x: 0,
				y: 90,
				cssColor: "blue",
				parent: scene
			});
			g.game.replaceScene(scene);
		});
	});
	g.game.pushScene(scene);
}

module.exports = main;
