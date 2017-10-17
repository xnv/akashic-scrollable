# Scrollable

The heart of the akashic-scrollable is the `Scrollable` class.

A `Scrollable` instance clips the appearance of the content entities,
manages the scrollbars and tracks the scrollable area automatically.
While using default scrollbars, the only class you need to know is `Scrollable`.

It can be obtained by `import` in TypeScript/ES2015:

```
import { Scrollable } from "@xnv/akashic-scrollable";
```

or `require()` in CommonJS:

```
var Scrollable = require("@xnv/akashic-scrollable").Scrollable;
```

### Instantiate

`Scrollable` is a subclass of `g.E`: its instance can be created by `new`.
The following statement creates a 100x100 `Scrollable` instance which is vertically scrollable:

```
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
```

where `scene` is a `g.Scene` instance.

Running this code you see nothing but a vertical scrollbar shown at (100, 0).
The scrollbar should be disabled because no content entity is added and then no scrollable area it has.

### Adding Contents

You can add any entity as a content by appending to `Scrollable#content`, the content root.
`content` is an entity (`g.E`).
The descendants of `scrollable.content` is called the content entities (of `scrollable`)
and clipped by the `scrollable`'s rectangle (i.e. 100x100).

The following code adds a 20x20 red square to `scrollable`:

```
const redRect = new g.FilledRect({
	scene: scene,  // a g.Scene instance
	width: 20,
	height: 20,
	x: 0,
	y: 90,
	cssColor: "red"
});
scrollable.content.append(redRect);
```

Now you will see the top half of the clipped red square and that the vertical scrollbar is enabled.
You can scroll the entity with the scrollbar.

Add your entities as many as you need.
Any kind of entities can be added.

Since `Scrollable#content` is just an entity (i.e. `g.E`), you can do any operation
as `g.E`. But its not recommended to modify `content` itself except adding/removing children.

