import { Tilemap } from "./tilemap";

export interface MarkerLayerOptions {
  positions: [number, number][];
  image: CanvasImageSource;
}

export class MarkerLayer {
  map: Tilemap;

  constructor(map: Tilemap) {
    this.map = map;
  }

  draw() {}
}
