import { TileLayer } from "./tile-layer";
import { Gesture } from "./gesture";
import { MarkerLayer } from "./marker-layer";
import { DomLayer } from "./dom-layer";
import { ImageLayer } from "./image-layer";

export interface TilemapOptions {
  /**
   * canvas element
   */
  element: string | HTMLElement;

  /**
   * map original size
   */
  size: [number, number];

  /**
   * map origin
   */
  origin: [number, number];

  /**
   * default: 0
   */
  maxZoom?: number;

  onClick?: (event?: MarkerEvent) => void;
  onMouseMove?: (event?: MarkerEvent) => void;
  tileOffset?: [number, number];
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
  canvas2d: CanvasRenderingContext2D;
  options: TilemapOptions;
  offset = [0, 0];
  scale = 0;
  minZoom = 0;
  size = [0, 0];
  tileLayers = new Set<TileLayer>();
  markerLayers = new Set<MarkerLayer>();
  domLayers = new Set<DomLayer>();
  imageLayers = new Set<ImageLayer>();
  gesture: Gesture;
  lastDrawTime = 0;

  constructor(options: TilemapOptions) {
    this.options = {
      ...options,
      tileOffset: options.tileOffset ?? [0, 0],
      maxZoom: options.maxZoom ?? 0,
    };

    if (typeof options.element == "string") {
      this.element = document.querySelector(options.element)!;
    } else {
      this.element = options.element;
    }

    this.element.style.touchAction = "none";
    this.canvas = document.createElement("canvas");
    this.element.appendChild(this.canvas);
    this.canvas2d = this.canvas.getContext("2d")!;
    this.gesture = new Gesture(this);

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setTimeout(() => this.resize(width, height), 0);
    });
    resizeObserver.observe(this.element);

    this.element.addEventListener("mousemove", ({ clientX, clientY }) => {
      const result = this.findMarker([clientX, clientY]);
      if (result) {
        result?.[0].options.onMouseMove?.(result[1]);
        this.options.onMouseMove?.({ target: result[0], index: result[1] });
        return;
      }
      this.options.onMouseMove?.();
    });

    this.domLayers.clear = new Proxy(this.domLayers.clear, {
      apply: (target, thisArg: Set<DomLayer>) => {
        for (const i of thisArg.values()) {
          this.element.removeChild(i.element);
        }
        return target.apply(thisArg);
      },
    });

    this.domLayers.delete = new Proxy(this.domLayers.delete, {
      apply: (target, thisArg: Set<DomLayer>, argArray: [DomLayer]) => {
        this.element.removeChild(argArray[0].element);
        return target.apply(thisArg, argArray);
      },
    });
  }

  findMarker(point: [number, number]): [MarkerLayer, number] | undefined {
    const markerLayers = Array.from(this.markerLayers).reverse();
    for (const marker of markerLayers) {
      const { image, positions, anchor } = marker.options;
      const size = [image.width as number, image.height as number];
      size[0] /= devicePixelRatio;
      size[1] /= devicePixelRatio;
      for (let index = positions.length - 1; index >= 0; index -= 1) {
        let [x, y] = this.toCanvasPositionWithOffset(positions[index]);
        const centerOffset = [size[0] * anchor![0], size[1] * anchor![1]];
        if (
          point[0] > x - centerOffset[0] &&
          point[0] < x + (size[0] - centerOffset[0]) &&
          point[1] > y - centerOffset[1] &&
          point[1] < y + (size[0] - centerOffset[0])
        ) {
          return [marker, index];
        }
      }
    }
  }

  toCanvasPositionWithOffset(position: [number, number]) {
    const { offset } = this;
    let [x, y] = this.toCanvasPosition(position);
    return [x + offset[0], y + offset[1]];
  }

  toCanvasPosition([x, y]: [number, number]) {
    const [px, py] = this.mapPointOffset;
    return [(x + px) * this.scale, (y + py) * this.scale];
  }

  overlaps(position: [number, number], size: [number, number]) {
    if (
      position[0] + size[0] > -this.offset[0] &&
      position[0] < this.size[0] - this.offset[0] &&
      position[1] + size[1] > -this.offset[1] &&
      position[1] < this.size[1] - this.offset[1]
    ) {
      return true;
    }
    return false;
  }

  get mapPointOffset() {
    const { origin, tileOffset } = this.options;
    return [origin[0] + tileOffset![0], origin[1] + tileOffset![1]];
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
      this.scale = this.gesture.limitScale(minScale);
      this.draw();
    } else if (this.minZoom != minZoom) {
      this.minZoom = minZoom;
      this.gesture.scaleTo(this.scale, [this.size[0] / 2, this.size[1] / 2]);
    }
  }

  draw() {
    const now = Date.now();
    if (now != this.lastDrawTime) {
      requestAnimationFrame(() => {
        const { canvas2d, canvas, offset } = this;
        canvas2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        canvas2d.clearRect(0, 0, canvas.width, canvas.height);
        canvas2d.translate(offset[0], offset[1]);
        for (const layer of this.tileLayers) {
          layer.draw();
        }
        for (const layer of this.imageLayers) {
          layer.draw();
        }
        for (const layer of this.markerLayers) {
          layer.draw();
        }
        for (const layer of this.domLayers) {
          layer.draw();
        }
      });
      this.lastDrawTime = now;
    }
  }
}
