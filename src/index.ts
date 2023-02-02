import { TileLayer } from "./tile-layer";
import { Gesture } from "./gesture";

export interface CanvasTilemapOptions {
  /**
   * canvas element
   */
  element: string | HTMLCanvasElement;

  /**
   * 地图原始尺寸
   */
  size: [number, number];

  /**
   * 地图原点
   */
  origin: [number, number];

  /**
   * tile 大小，默认 256
   */
  tileSize?: number;

  /**
   * 允许的最大 zoom，默认为 0
   */
  maxZoom?: number;
}

export class CanvasTilemap {
  element: HTMLCanvasElement;
  options: CanvasTilemapOptions;
  offset = [0, 0];
  scale = 0;
  minZoom = 0;
  canvas: CanvasRenderingContext2D;
  size = [0, 0];
  tileLayers: TileLayer[] = [];
  gesture: Gesture;

  constructor(options: CanvasTilemapOptions) {
    this.options = {
      ...options,
      tileSize: options.tileSize ?? 256,
      maxZoom: options.maxZoom ?? 0,
    };

    if (typeof options.element == "string") {
      this.element = document.querySelector(options.element)!;
    } else {
      this.element = options.element;
    }
    this.canvas = this.element.getContext("2d")!;

    const style = getComputedStyle(this.element);
    this.element.width = parseFloat(style.width) * devicePixelRatio;
    this.element.height = parseFloat(style.height) * devicePixelRatio;
    this.size = [
      this.element.width / devicePixelRatio,
      this.element.height / devicePixelRatio,
    ];

    const minScale = Math.max(
      this.size[0] / options.size[0],
      this.size[1] / options.size[1]
    );
    this.minZoom = Math.log2(minScale);
    this.scale = minScale;
    this.gesture = new Gesture(this);
    this.draw();
  }

  draw() {
    requestAnimationFrame(() => {
      const { canvas, element, offset } = this;
      canvas.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      canvas.clearRect(0, 0, element.width, element.height);
      canvas.translate(offset[0], offset[1]);
      for (const tileLayer of this.tileLayers) {
        tileLayer.draw();
      }
    });
  }
}

const tilemap = new CanvasTilemap({
  element: "#canvas",
  size: [17408, 16384],
  origin: [3568, 6286],
  maxZoom: 1,
});
tilemap.tileLayers.push(
  new TileLayer(tilemap, {
    minZoom: 10,
    maxZoom: 13,
    offset: [-5120, 0],
    getTileUrl(x, y, z) {
      return `https://assets.yuanshen.site/tiles_twt34/${z}/${x}_${y}.png`;
    },
  })
);
// new CanvasTilemap({
//   element: "#canvas",
//   size: [12288, 12288],
//   origin: [1800, -500],
//   maxZoomLevel: 3,
//   getTileUrl(x, y, z) {
//     return `https://assets.yuanshen.site/tiles_cyjy/${z + 10}/${x}_${y}.png`;
//   },
// });
