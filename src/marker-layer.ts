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
    const { canvas2d } = this.map;
    const size: [number, number] = [
      image.width as number,
      image.height as number,
    ];
    size[0] /= devicePixelRatio;
    size[1] /= devicePixelRatio;
    for (const i of positions) {
      let [x, y] = this.map.toCanvasPosition(i);
      x -= size[0] * anchor![0];
      y -= size[1] * anchor![1];
      if (this.map.overlaps([x, y], size)) {
        canvas2d.drawImage(image, x, y, size[0], size[1]);
      }
    }
  }
}
