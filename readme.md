# canvas-tilemap

Super smooth 2d tilemap build with canvas2d.

## Install

```
npm i @7c00/canvas-tilemap
```

## Usage

### Create tilemap

```html
<div id="tilemap"></div>
```

```typescript
const tilemap = new Tilemap({
  element: "#tilemap",
  size: [12288, 12288],
  origin: [3568, 6286],
});
```

### Add TileLayer

```typescript
tilemap.tileLayers.add(
  new TileLayer(tilemap, {
    minZoom: 10,
    maxZoom: 13,
    getTileUrl(x, y, z) {
      return `https://assets.yuanshen.site/tiles_yxg2/${z}/${x}_${y}.png`;
    },
  })
);
```

### Add MarkerLayer
```typescript
const image = new Image();
image.src = "https://assets.yuanshen.site/icons/127.png";
image.addEventListener("load", () => {
  tilemap.draw();
});
const markerLayer = new MarkerLayer(tilemap, {
  positions: [
    [-999, 3766],
    [-1685, 2359],
    [112, 1365],
    [1231, 575],
    [1202, -346],
    [1737, 14],
    [3101, 422],
    [3488, 215],
    [3147, 1495],
    [3455, 801],
    [4229, 888],
    [2804, 2379],
    [3073, 3269],
    [2716, 4054],
    [3845, 2665],
    [4522, 2307],
    [6108, 974],
    [5866, 205],
    [5178, 29],
    [6231, -411],
    [2095, -591],
    [1188, -4131],
    [7413, -2412],
    [4783, 5059],
  ],
  image: image,
});
tilemap.markerLayers.add(markerLayer);
```
