import { Layer, Tilemap } from "./tilemap";

export type ImageBounds = [[number, number], [number, number]];

export interface ImageLayerOptions {
  bounds: ImageBounds;
  image: CanvasImageSource;
}

export class ImageLayer extends Layer {
  map: Tilemap;
  options: ImageLayerOptions;

  constructor(map: Tilemap, options: ImageLayerOptions) {
    super();
    this.map = map;
    this.options = options;
  }

  draw() {
    const { image, bounds } = this.options;
    const { canvas2d, options, scale } = this.map;
    const offset = [
      options.origin[0] - options.tileOffset![0],
      options.origin[1] - options.tileOffset![1],
    ];
    const x0 = (offset[0] + bounds[0][0]) * scale;
    const y0 = (offset[1] + bounds[0][1]) * scale;
    const x1 = (offset[0] + bounds[1][0]) * scale;
    const y1 = (offset[1] + bounds[1][1]) * scale;
    canvas2d.drawImage(image, x0, y0, x1 - x0, y1 - y0);
  }
}
