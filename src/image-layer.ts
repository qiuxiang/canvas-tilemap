import { Layer, Tilemap } from "./tilemap";
import { safeCeil } from "./utils";

export type ImageBounds = [[number, number], [number, number]];

export interface ImageLayerOptions {
  bounds: ImageBounds;
  image: CanvasImageSource;
}

export class ImageLayer extends Layer {
  map: Tilemap;
  options: ImageLayerOptions;
  images: Record<number, HTMLCanvasElement> = {};
  minZoom = 0;

  constructor(map: Tilemap, options: ImageLayerOptions) {
    super();
    this.map = map;
    this.options = options;
    this.init();
  }

  async init() {
    this.minZoom = safeCeil(this.map.minZoom);
    let image = this.options.image;
    for (let zoom = 0; zoom >= this.minZoom; zoom -= 1) {
      image = this.downscaleImage(image as HTMLCanvasElement);
      this.images[zoom] = image;
    }
  }

  downscaleImage(image: HTMLCanvasElement) {
    const canvas = document.createElement("canvas");
    const canvas2d = canvas.getContext("2d")!;
    canvas.width = image.width / 2;
    canvas.height = image.height / 2;
    if (canvas.width == 0 || canvas.height == 0) {
      return image;
    }
    canvas2d.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  draw() {
    const { canvas2d, scale } = this.map;
    let zoom = safeCeil(Math.log2(scale));
    zoom = Math.max(Math.min(zoom, 0), this.minZoom);
    const image = this.images[zoom] ?? this.options.image;
    const { bounds } = this.options;
    const [px, py] = this.map.mapPointOffset;
    const x0 = (px + bounds[0][0]) * scale;
    const y0 = (py + bounds[0][1]) * scale;
    const x1 = (px + bounds[1][0]) * scale;
    const y1 = (py + bounds[1][1]) * scale;
    const size: [number, number] = [x1 - x0, y1 - y0];
    if (this.map.overlaps([x0, y0], size)) {
      canvas2d.drawImage(image, x0, y0, size[0], size[1]);
    }
  }
}
