# akahsic-scrollable Guide

**akashic-scrollable** は、[Akashic Engine][ae] でエンティティのクリッピングとスクロールを実現するライブラリです。

[ae]: https://akashic-games.github.io/

## インストール

ゲームのルートディレクトリ(game.jsonのあるディレクトリ)で `akashic` コマンド ([akashic-cli][cli]) を実行してください:

```
akashic install @xnv/akashic-scrollable
```

[cli]: https://github.com/akashic-games/akashic-cli

## 利用方法

akashic-scrollable の核は `Scrollable` クラスです。

`Scrollable` は、TypeScript であれば `import` で取得できます:

```ts
import { Scrollable } from "@xnv/akashic-scrollable";
```

あるいは CommonJS であれば `require()` で:

```js
const Scrollable = require("@xnv/akashic-scrollable").Scrollable;
```

`Scrollable` は `g.E` (エンティティ) のサブクラスです: インスタンスは `new` で生成されます。
次の文は、100x100 の領域を持つ縦スクロール可能な `Scrollable` のインスタンスを (0, 0) の位置に生成します。

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

ただしここで `scene` は `g.Scene` のインスタンスです。

このコードを実行すると、(100, 0) の位置に描画された縦スクロールバーが表示されます。
スクロール領域内に何もないので、スクロールバーは無効化されているはずです。

### コンテンツの追加

`Scrollable` はコンテンツルート `Scrollable#content` を持ちます。

`content` は `g.E` で、任意のエンティティを追加することができます。
追加されたエンティティは、`Scrollable` のエンティティ矩形 (`width` と `height` が作る矩形) によってクリッピングされます。
`Scrollable` の領域をはみ出るエンティティがある場合、スクロールバーが有効になります。

次のコードは `scrollable` に 20x20 の赤い矩形を加えます。

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

このコードを実行すると、下半分がクリッピングされた赤い矩形の上半分と、有効になった縦スクロールバーが表示されます。

`Scrollable#content` には任意の数・任意の種類のエンティティを追加することができます。
`Scrollable#content` は単なるエンティティなので、`g.E` としての任意の操作が行えますが、
子孫の追加・削除以外に `content` を直接操作することは推奨されません。

### Scrollable のオプション

`Scrollable` のコンストラクタは、引数としてオブジェクトを一つとります。
型は `ScrollableParameterObject` で、 `g.E` のコンストラクタ引数に対応する値に加えて、次のオプションが利用できます。

|プロパティ名|型|説明|デフォルト値|
|-------------|----|-----------|-------------|
|`width`|`number`|このエンティティの幅、そしてスクロール領域の幅。(`g.E` と異なりこの値は必須です)|N/A|
|`height`|`number`|このエンティティの高さ、そしてスクロール領域の高さ。(`g.E` と異なりこの値は必須です)|N/A|
|`vertical`|`boolean` or `Scrollbar`|縦スクロールの有効・無効。 `Scrollbar` が与えられた場合、縦スクロールバーとして使われます。|`false`|
|`horizontal`|`boolean` or `Scrollbar`|横スクロールの有効・無効。 `Scrollbar` が与えられた場合、横スクロールバーとして使われます。|`false`|
|`touchScroll`|`boolean`|タッチスクロール(エンティティ全体のスワイプ操作によるスクロール)の有効・無効。|`false`|
|`momentumScroll`|`boolean`|慣性スクロールの有効・無効。 `touchScroll` 時のみ動作します。|`true`|
|`insertBars`|`boolean`|真の場合、スクロールバーをエンティティ矩形の内側に配置します。|`false`|

### カスタムスクロールバー

スクロールバーのデザインは任意にカスタマイズできます。
`Scrollable` のコンストラクタ引数の `vertical`, `horizontal` プロパティに `Scrollbar` のインスタンスを与えると、
デフォルトのスクロールバーに代えてそのインスタンスが利用されます。

たとえば `myScrollbar: Scrollbar` がある時、次のように利用することができます:

```js
const scrollable = new Scrollable({
	scene: scene,  // a g.Scene instance
	width: 100,
	height: 100,
	vertical: myScrollbar
});
```

このコードは `scrollable` を縦方向にスクロール可能にし、そのスクロールバーとして `myScrollbar` を使います。

### Scrollbar

`Scrollbar` は、TypeScriptで次のように定義されます:

```ts
interface ScrollbarOperations {
	onChangeBarPositionRate: g.Trigger<number>;
	setBarProperties(posRate?: number | null, contentLength?: number | null, viewLength?: number | null): void;
}

type Scrollbar = g.E & ScrollbarOperations;
```

すなわちスクロールバーは `g.E` のサブクラスとして実装され、かつ二つのプロパティを持つ必要があります:
`onChangeBarPositionRate` と `setBarProperties` です。

`onChangeBarPositionRate` は `g.Trigger<number>` で、
スクロールバーのスクロール位置が変化した時に `fire()` されなければなりません。
`fire` の引数は [0, 1] の数値で、スクロール位置の比率を表す必要があります。

`setBarProperties` は関数で、呼び出された場合、
与えられる次の三つの引数の内容をスクロールバーの表示内容に反映させなければなりません。

 * `posRate` スクロール位置の比率 ([0, 1])
 * `contentLength` スクロール領域の長さ
 * `viewLength` 表示領域の長さ

`null` が指定された引数は変化しないものとして扱われなければなりません。

### デフォルトのスクロールバー

akashic-scrollable が提供する `Scrollbar` の実装クラスは二つ、
デフォルトのスクロールバーである `NinePatchVerticalScrollbar` と `NinePatchHorizontalScrollbar` です。
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

[9patch]: https://github.com/libgdx/libgdx/wiki/Ninepatches
