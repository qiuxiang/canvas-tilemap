import { Layer, Tilemap } from "./tilemap";

export interface MarkerLayerOptions {
  positions: [number, number][];
  image: CanvasImageSource;
  anchor?: [number, number];
  onClick?: (index: number) => void;
  onMouseMove?: (index: number) => void;
}

export class MarkerLayer extends Layer {
  map: Tilemap;
  options: MarkerLayerOptions;

  constructor(map: Tilemap, options: MarkerLayerOptions) {
    super();
    this.map = map;
    this.options = { ...options, anchor: options.anchor ?? [0.5, 1] };
  }

  draw() {
    const { positions, image, anchor } = this.options;
    const { canvas2d, scale, options } = this.map;
    const size = [image.width as number, image.height as number];
    size[0] /= devicePixelRatio;
    size[1] /= devicePixelRatio;
    for (const i of positions) {
      const x = options.origin[0] - options.tileOffset![0] + i[0];
      const y = options.origin[1] - options.tileOffset![1] + i[1];
      canvas2d.drawImage(
        image,
        x * scale - size[0] * anchor![0],
        y * scale - size[1] * anchor![1],
        size[0],
        size[1]
      );
    }
  }
}
