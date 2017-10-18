# Options of Scrollable

The constructor of `Scrollable` takes an object (a `ScrollableParameterObject`) as the argument.
In addition to the values for the constructor of `g.E`, the following options available.

|Property Name|Type|Description|Default Value|
|-------------|----|-----------|-------------|
|`width`|`number`|The width of this entity and the width of the scrolled area. Unline `g.E`, this is required.|N/A|
|`height`|`number`|The height of this entity and the height of the scrolled area. Unline `g.E`, this is required.|N/A|
|`vertical`|`boolean` or `Scrollbar`|Enable/disable vertical scrolling.  If a `Scrollbar` is given, used as the vertical scrollbar.|`false`|
|`horizontal`|`boolean` or `Scrollbar`|Enable/disable horizontal scrolling.  If a `Scrollbar` is given, used as the horizontal scrollbar.|`false`|
|`touchScroll`|`boolean`|Enable/disable scrolling by dragging/swiping on the entity itself.|`false`|
|`insertBars`|`boolean`|If `true`, scrollbars are shown inside the entity's rectangle.|`false`|

