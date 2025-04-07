# Using Your Own Scrollbar

You can use your own scrollbars.
By giving a `Scrollbar` instance to the `vertical` or `horizontal` property of the constructor argument,
it will be used as the scrollbar instead of the default one.

For example, if you have `myScrollbar: Scrollbar`, it can be used as:

```
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

```
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
