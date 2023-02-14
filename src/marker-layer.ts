import { Layer, Tilemap } from "./tilemap";

export interface MarkerItem<T = any> {
  x: number;
  y: number;
  data?: T;
}

export interface MarkerLayerOptions<T> {
  items: MarkerItem<T>[];
  image: CanvasImageSource;
  anchor?: [number, number];
  onClick?: (index: number) => void;
  onMouseMove?: (index: number) => void;

  /**
   * default: true
   */
  clickable: boolean;
}

export class MarkerLayer<T = any> extends Layer {
  map: Tilemap;
  options: MarkerLayerOptions<T>;

  constructor(map: Tilemap, options: MarkerLayerOptions<T>) {
    super();
    this.map = map;
    this.options = {
      ...options,
      anchor: options.anchor ?? [0.5, 1],
      clickable: options.clickable ?? true,
    };
  }

  draw() {
    const { items, image, anchor } = this.options;
    const { canvas2d } = this.map;
    const size: [number, number] = [
      image.width as number,
      image.height as number,
    ];
    size[0] /= devicePixelRatio;
    size[1] /= devicePixelRatio;
    for (const i of items) {
      let [x, y] = this.map.toCanvasPosition([i.x, i.y]);
      x -= size[0] * anchor![0];
      y -= size[1] * anchor![1];
      if (this.map.overlaps([x, y], size)) {
        canvas2d.drawImage(image, x, y, size[0], size[1]);
      }
    }
  }
}
