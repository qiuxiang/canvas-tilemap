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

  onClick?: (event?: MarkerEvent) => void;

  onMouseMove?: (event?: MarkerEvent) => void;
}

export interface MarkerEvent {
  target: MarkerLayer;
  index: number;
}

export abstract class Layer {
  abstract draw(): void;
}

export class Tilemap {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  options: TilemapOptions;
  offset = [0, 0];
  scale = 0;
  minZoom = 0;
  render: CanvasRenderingContext2D;
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

    this.canvas = document.createElement("canvas");
    this.canvas.style.touchAction = "none";
    this.element.appendChild(this.canvas);
    this.render = this.canvas.getContext("2d")!;
    this.gesture = new Gesture(this);

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setTimeout(() => this.resize(width, height), 0);
    });
    resizeObserver.observe(this.element);

    this.element.addEventListener("click", ({ clientX, clientY }) => {
      const result = this.findMarker([clientX, clientY]);
      if (result) {
        result?.[0].options.onClick?.(result[1]);
        this.options.onClick?.({ target: result[0], index: result[1] });
        return;
      }
      this.options.onClick?.();
    });

    this.element.addEventListener("mousemove", ({ clientX, clientY }) => {
      const result = this.findMarker([clientX, clientY]);
      if (result) {
        result?.[0].options.onMouseMove?.(result[1]);
        this.options.onMouseMove?.({ target: result[0], index: result[1] });
        return;
      }
      this.options.onMouseMove?.();
    });
  }

  findMarker(point: [number, number]): [MarkerLayer, number] | undefined {
    const { scale, offset } = this;
    const { origin } = this.options;
    const markerLayers = Array.from(this.markerLayers).reverse();
    for (const marker of markerLayers) {
      const { image, positions, offset: markerOffset } = marker.options;
      const size = [image.width as number, image.height as number];
      size[0] /= devicePixelRatio;
      size[1] /= devicePixelRatio;
      for (let index = positions.length - 1; index >= 0; index -= 1) {
        let [x, y] = positions[index];
        x = (x + origin[0] - markerOffset![0]) * scale + offset[0];
        y = (y + origin[1] - markerOffset![1]) * scale + offset[1];
        if (
          point[0] > x - size[0] / 2 &&
          point[0] < x + size[0] / 2 &&
          point[1] > y - size[1] &&
          point[1] < y
        ) {
          return [marker, index];
        }
      }
    }
  }

  resize(width: number, height: number) {
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
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
        const { render: canvas, canvas: element, offset } = this;
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
