import { Tilemap } from "./tilemap";

export interface MarkerLayerOptions {
  positions: [number, number][];
  image: CanvasImageSource;
  offset?: [number, number];
}

export class MarkerLayer {
  map: Tilemap;
  options: MarkerLayerOptions;

  constructor(map: Tilemap, options: MarkerLayerOptions) {
    this.map = map;
    this.options = { ...options, offset: options.offset ?? [0, 0] };
  }

  draw() {
    const { offset, positions, image } = this.options;
    const { canvas, scale, options } = this.map;
    const size = [image.width as number, image.height as number];
    size[0] /= devicePixelRatio;
    size[1] /= devicePixelRatio;
    for (const i of positions) {
      const x = options.origin[0] - offset![0] + i[0];
      const y = options.origin[1] - offset![1] + i[1];
      canvas.drawImage(
        image,
        x * scale - size[0] / 2,
        y * scale - size[1],
        size[0],
        size[1]
      );
    }
  }
}
