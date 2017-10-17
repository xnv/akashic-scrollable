# カスタムスクロールバー

[前節][opts] で述べた通り、スクロールバーのデザインは任意にカスタマイズできます。
`Scrollable` のコンストラクタ引数の `vertical`, `horizontal` プロパティに `ScrollbarLike` のインスタンスを与えると、
デフォルトのスクロールバーに代えてそのインスタンスが利用されます。

たとえば `myScrollbar: ScrollbarLike` がある時、次のように利用することができます:

```
const scrollable = new Scrollable({
	scene: scene,  // a g.Scene instance
	width: 100,
	height: 100,
	vertical: myScrollbar
});
```

このコードは `scrollable` を縦方向にスクロール可能にし、そのスクロールバーとして `myScrollbar` を使います。

### ScrollbarLike

`ScrollbarLike` は、TypeScriptで次のように定義されます:

```
interface ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	setBarProperties(posRate?: number | null, contentLength?: number | null, viewLength?: number | null): void;
}

type ScrollbarLike = g.E & ScrollbarOperations;
```

すなわちスクロールバーは `g.E` のサブクラスとして実装され、かつ二つのプロパティを持つ必要があります:
`onChangeBarPositionRate` と `setBarProperties` です。

前者、 `onChangeBarPositionRate` は `g.Trigger<number>` で、
スクロールバーのスクロール位置が変化した時に `fire()` されなければなりません。
`fire` の引数は [0, 1] の数値で、スクロール位置の比率を表す必要があります。

後者、 `setBarProperties` は関数で、呼び出された場合、
与えられる次の三つの引数の内容をスクロールバーの表示内容に反映させなければなりません。

 * `posRate` スクロール位置の比率 ([0, 1])
 * `contentLength` スクロール領域の長さ
 * `viewLength` 表示領域の長さ

`null` が指定された引数は変化しないものとして扱われなければなりません。

### デフォルトのスクロールバー

akashic-scrollable が提供する `ScrollbarLike` の実装クラスは二つ、
デフォルトのスクロールバーである `NinePatchVerticalScrollbar` と `NinePathHorizontalScrollbar` です。
これらは名前のとおり、与えられた画像 (`g.Surface`) を9パッチ画像としてバーや背景の描画に用いるものです。
(9パッチについては [libgdxの文書のintroduction][9patch] などを参照してください。)

デフォルトのスクロールバーは、 `Scrollable` のコンストラクタ引数の `vertical` と `horizontal` に `true` が指定された時、
デフォルトの画像を与えて生成され利用されます。

シンプルなカスタマイズとして、独自の画像を与えた `NinePatchVerticalScrollbar` などを利用することもできます。
例えば `yourOwnImage: g.Surface` がある場合、次のように縦スクロールバーの画像として使うことができます。

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

デフォルトと異なり、この場合スクロールバーの背景部分はなくなります。
背景の画像を指定する場合には `bgImage` プロパティを利用してください。

[opts]: ./options.md
[9patch]: https://github.com/libgdx/libgdx/wiki/Ninepatches

