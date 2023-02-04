import { Layer, Tilemap } from "./tilemap";

export interface MarkerLayerOptions {
  positions: [number, number][];
  image: CanvasImageSource;
  onClick?: (index: number) => void;
  onMouseMove?: (index: number) => void;
}

export class MarkerLayer extends Layer {
  map: Tilemap;
  options: MarkerLayerOptions;

  constructor(map: Tilemap, options: MarkerLayerOptions) {
    super();
    this.map = map;
    this.options = options;
  }

  draw() {
    const { positions, image } = this.options;
    const { render: canvas, scale, options } = this.map;
    const size = [image.width as number, image.height as number];
    size[0] /= devicePixelRatio;
    size[1] /= devicePixelRatio;
    for (const i of positions) {
      const x = options.origin[0] - options.offset![0] + i[0];
      const y = options.origin[1] - options.offset![1] + i[1];
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
