# Scrollableのオプション

`Scrollable` のコンストラクタは、引数としてオブジェクトを一つとります。
型は `ScrollableParameterObject` で、 `g.E` のコンストラクタ引数に対応する値に加えて、次のオプションが利用できます。

|プロパティ名|型|説明|デフォルト値|
|-------------|----|-----------|-------------|
|`width`|`number`|このエンティティの幅、そしてスクロール領域の幅。(`g.E` と異なりこの値は必須です)|N/A|
|`height`|`number`|このエンティティの高さ、そしてスクロール領域の高さ。(`g.E` と異なりこの値は必須です)|N/A|
|`vertical`|`boolean` or `ScrollbarLike`|縦スクロールの有効・無効。 `ScrollbarLike` が与えられた場合、縦スクロールバーとして使われます。|`false`|
|`horizontal`|`boolean` or `ScrollbarLike`|横スクロールの有効・無効。 `ScrollbarLike` が与えられた場合、横スクロールバーとして使われます。|`false`|
|`touchScroll`|`boolean`|タッチスクロール(エンティティ全体のスワイプ操作によるスクロール)の有効・無効。|`false`|
|`insertBars`|`boolean`|真の場合、スクロールバーをエンティティ矩形の内側に配置する。|`false`|

