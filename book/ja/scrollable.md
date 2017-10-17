# Scrollable

akashic-scrollable の核は `Scrollable` クラスです。

`Scrollable` のインスタンスは、そのコンテンツエンティティの描画内容をクリッピングし、
スクロールバーを管理し、さらにスクロール領域の変化に自動的に追従します。
デフォルトのスクロールバーを利用する限り、 `Scrollable` 以外を扱う必要はありません。

`Scrollable` は TypeScript/ES2015 であれば `import` で取得できます:

```
import { Scrollable } from "@xnv/akashic-scrollable";
```

あるいは CommonJS であれば `require()` で:

```
var Scrollable = require("@xnv/akashic-scrollable").Scrollable;
```

### 生成

`Scrollable` は `g.E` (エンティティ) のサブクラスです: インスタンスは `new` で生成されます。
次の文は、100x100 の領域を持つ縦スクロール可能な `Scrollable` のインスタンスを (0, 0) の位置に生成します。

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

ただしここで `scene` は `g.Scene` のインスタンスです。

このコードを実行すると、(100, 0) の位置に描画された縦スクロールバーが表示されます。
スクロール領域内に何もないので、スクロールバーは無効化されているはずです。

### コンテンツの追加

`Scrollable` はコンテンツルート `Scrollable#content` を持ちます。
`content` は `g.E` で、任意のエンティティを追加することができます。
`content` の子孫エンティティをコンテンツエンティティと呼びます。
コンテンツエンティティは `Scrollable` のエンティティ矩形 (`width` と `height` が作る矩形) によってクリッピングされます。

次のコードは `scrollable` に 20x20 の赤い矩形を加えます。

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

このコードを実行すると、下半分がクリッピングされた赤い矩形の上半分と、有効になった縦スクロールバーが表示されます。

`Scrollable#content` には任意の数・任意の種類のエンティティを追加することができます。
`Scrollable#content` は単なるエンティティなので、`g.E` としての任意の操作が行えますが、
子孫の追加・削除以外に `content` を直接操作することは推奨されません。
