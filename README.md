# drawing
draw things in your browser

## Examples
```js
// Create an editor
var element = document.querySelector("div"),
    settings = {};
const x = new Drawing(element, settings);
x.create();
```

```js
// Undo
x.undo();

// Redo
x.redo();
```

```js
// Imports an image and adds it to the history
x.import("data:image/png;base64,...", true);

// Exports everything drawn to a data URL
var exported = x.export();
```
