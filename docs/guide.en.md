# akahsic-scrollable Guide

**akashic-scrollable** is a simple library for [Akashic Engine (ja)][ae] that provides clipping and scrolling entities.

[ae]: https://akashic-games.github.io/

## Installation

Use `akashic` command provided by [akashic-cli (ja)][cli] at the game directory root (which includes game.json):

```
akashic install @xnv/akashic-scrollable
```

[cli]: https://github.com/akashic-games/akashic-cli

## Usage

The heart of the akashic-scrollable is the `Scrollable` class.

It can be obtained by `import` in TypeScript:

```ts
import { Scrollable } from "@xnv/akashic-scrollable";
```

or `require()` in CommonJS:

```js
const Scrollable = require("@xnv/akashic-scrollable").Scrollable;
```

`Scrollable` is a subclass of `g.E`: its instance can be created by `new`.
The following statement creates a 100x100 `Scrollable` instance which is vertically scrollable:

```js
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
The descendants of `scrollable.content` is clipped by the `scrollable`'s rectangle.

The following code adds a 20x20 red square to `scrollable`:

```js
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

### Options of Scrollable

The constructor of `Scrollable` takes an object (a `ScrollableParameterObject`) as the argument.
In addition to the values for the constructor of `g.E`, the following options available.

|Property Name|Type|Description|Default Value|
|-------------|----|-----------|-------------|
|`width`|`number`|The width of this entity and the width of the scrolled area. Unline `g.E`, this is required.|N/A|
|`height`|`number`|The height of this entity and the height of the scrolled area. Unline `g.E`, this is required.|N/A|
|`vertical`|`boolean` or `Scrollbar`|Enable/disable vertical scrolling.  If a `Scrollbar` is given, used as the vertical scrollbar.|`false`|
|`horizontal`|`boolean` or `Scrollbar`|Enable/disable horizontal scrolling.  If a `Scrollbar` is given, used as the horizontal scrollbar.|`false`|
|`touchScroll`|`boolean`|Enable/disable scrolling by dragging/swiping on the entity itself.|`false`|
|`momentumScroll`|`boolean`|Enable/disable momentum scrolling. Works only with `touchScroll`.|`true`|
|`insertBars`|`boolean`|If `true`, scrollbars are shown inside the entity's rectangle.|`false`|


### Using Your Own Scrollbar

You can use your own scrollbars.
By giving a `Scrollbar` instance to the `vertical` or `horizontal` property of the constructor argument,
it will be used as the scrollbar instead of the default one.

For example, if you have `myScrollbar: Scrollbar`, it can be used as:

```js
const scrollable = new Scrollable({
	scene: scene,  // a g.Scene instance
	width: 100,
	height: 100,
	vertical: myScrollbar
});
```

This makes `scrollable` verticall scrollable and its vertical scrollbar will be `myScrollbar`.

### Scrollbar

`Scrollbar` is defined by TypeScript as the following:

```ts
interface ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	setBarProperties(posRate?: number | null, contentLength?: number | null, viewLength?: number | null): void;
}

type Scrollbar = g.E & ScrollbarOperations;
```

This means that scrollbars must be implemented as a subclass of `g.E` and have two properties:
`onChangeBarPositionRate` and `setBarProperties`.

The former, `onChangeBarPositionRate`, must be a `g.Trigger<number>`.
it must be `fire()`ed when the scroll position changed.
The argument for `fire` must be a number in [0, 1] that corresponds to the scroll position rate.

The latter, `setBarProperties` must be a function.
When it is called, the appeareance of the scrollbar must reflect the given properties.
It takes three arguments:

 * `posRate` the scroll position rate ([0, 1]).
 * `contentLength` the length of the whole scrolled content.
 * `viewLength` the length of the displayed area.

any properties specified as `null` should not be changed.

### Default Scrollbars

The default scrollbars, `NinePatchVerticalScrollbar` and `NinePatchHorizontalScrollbar` are
the only `Scrollbar` implementations provided by akashic-scrollable.
As the names suggest, they use ninepatch images (`g.Surface`) to draw its bar and background.
(If you are not familier with ninepatch, take a look at [a good introduction by libgdx][9patch].)

They are used when `true` is given to `vertical` or `horizontal` properits of the `Scrollable`'s constructor argument respectively,
with the default scrollbar images.

As a simple customization, you can use them with your own image.
For example, if you have `yourOwnImage: g.Surface` then it can be used for the vertical scrollbar as the following:

```
const scrollable = new Scrollable({
	scene: scene,  // a g.Scene instance
	width: 100,
	height: 100,
	vertical: new NinePatchVerticalScrollbar({
		scene: scene,
		image: yourOwnImage,
		bgImage: undefined
	})
});
```

[9patch]: https://github.com/libgdx/libgdx/wiki/Ninepatches

