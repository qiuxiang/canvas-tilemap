import { TileLayer } from "./tile-layer";
import { Gesture } from "./gesture";
import { MarkerLayer } from "./marker-layer";

export interface TilemapOptions {
  /**
   * canvas element
   */
  element: string | HTMLCanvasElement;

  /**
   * map original size
   */
  size: [number, number];

  /**
   * map origin
   */
  origin: [number, number];

  /**
   * default: 256
   */
  tileSize?: number;

  /**
   * default: 0
   */
  maxZoom?: number;
}

export class Tilemap {
  element: HTMLCanvasElement;
  options: TilemapOptions;
  offset = [0, 0];
  scale = 0;
  minZoom = 0;
  canvas: CanvasRenderingContext2D;
  size = [0, 0];
  tileLayers = new Set<TileLayer>();
  markerLayers = new Set<MarkerLayer>();
  gesture: Gesture;
  lastDrawTime = 0;

  constructor(options: TilemapOptions) {
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
    this.gesture = new Gesture(this);

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setTimeout(() => this.resize(width, height), 0);
    });
    resizeObserver.observe(this.element);
  }

  resize(width: number, height: number) {
    this.element.width = width * devicePixelRatio;
    this.element.height = height * devicePixelRatio;
    this.size = [width, height];
    const minScale = Math.max(
      this.size[0] / this.options.size[0],
      this.size[1] / this.options.size[1]
    );
    const minZoom = Math.log2(minScale);
    if (!this.scale) {
      this.minZoom = minZoom;
      this.scale = this.gesture.getNewScale(minScale);
    } else if (this.minZoom != minZoom) {
      this.minZoom = minZoom;
      this.gesture.scaleTo(this.scale, [this.size[0] / 2, this.size[1] / 2]);
    }
    this.draw();
  }

  draw() {
    const now = Date.now();
    if (now != this.lastDrawTime) {
      requestAnimationFrame(() => {
        const { canvas, element, offset } = this;
        canvas.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        canvas.clearRect(0, 0, element.width, element.height);
        canvas.translate(offset[0], offset[1]);
        for (const tileLayer of this.tileLayers) {
          tileLayer.draw();
        }
        for (const markerLayer of this.markerLayers) {
          markerLayer.draw();
        }
      });
      this.lastDrawTime = now;
    }
  }
}
