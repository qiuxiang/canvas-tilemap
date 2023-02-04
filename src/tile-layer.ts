import { Tilemap } from ".";
import { safeCeil } from "./utils";

export interface TileLayerOptions {
  minZoom: number;
  maxZoom: number;
  getTileUrl: (x: number, y: number, z: number) => string;

  /**
   * tile offset, default: [0, 0]
   */
  offset?: [number, number];

  /**
   * hack 用，修正一个偏移，之后会移除
   */
  dx?: number;
}

export class TileLayer {
  map: Tilemap;
  options: TileLayerOptions;
  tiles: Record<number, string[][]> = {};
  images: Record<string, HTMLImageElement> = {};

  constructor(map: Tilemap, options: TileLayerOptions) {
    this.map = map;
    this.options = {
      ...options,
      offset: options.offset ?? [0, 0],
    };
    const { size: mapSize } = map.options;
    const { minZoom, maxZoom, offset: tileOffset } = this.options;
    for (let z = minZoom; z <= maxZoom; z += 1) {
      const imageSize = map.options.tileSize! * 2 ** (maxZoom - z);
      const row = safeCeil(mapSize[1] / imageSize);
      const col = safeCeil(mapSize[0] / imageSize);
      const offset = [
        Math.floor(tileOffset![0] / imageSize),
        Math.floor(tileOffset![1] / imageSize),
      ];
      const tiles = [];
      for (let y = 0; y < row; y += 1) {
        tiles[y] = [] as string[];
        for (let x = 0; x < col; x += 1) {
          const url = options.getTileUrl(x + offset[0], y + offset[1], z);
          tiles[y][x] = url;
        }
      }
      this.tiles[z] = tiles;
    }
    for (const tiles of this.tiles[minZoom]) {
      for (const url of tiles) {
        const image = new Image();
        image.src = url;
        image.addEventListener("load", () => {
          this.images[url] = image;
          this.map.draw();
        });
      }
    }
  }

  draw() {
    const { minZoom, maxZoom, dx = 0 } = this.options;
    this.drawTiles(minZoom, dx * this.map.scale);

    let zoom = maxZoom + Math.log2(this.map.scale);
    zoom = safeCeil(Math.min(Math.max(zoom, minZoom), maxZoom));
    if (zoom > minZoom) {
      this.drawTiles(zoom);
    }
  }

  drawTiles(z: number, dx = 0) {
    const baseTiles = this.tiles[z];
    const { scale, options, offset, size } = this.map;
    const imageSize =
      options.tileSize! * 2 ** (this.options.maxZoom - z) * scale;
    const startX = Math.floor(-offset[0] / imageSize);
    const endX = safeCeil((size[0] - offset[0] + dx) / imageSize);
    const startY = Math.floor(-offset[1] / imageSize);
    const endY = safeCeil((size[1] - offset[1]) / imageSize);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const url = baseTiles[y][x];
        const image = this.images[baseTiles[y][x]];
        if (image) {
          this.map.canvas.drawImage(
            image,
            imageSize * x - dx,
            imageSize * y,
            imageSize,
            imageSize
          );
        } else {
          const image = new Image();
          image.src = url;
          image.addEventListener("load", () => {
            this.images[url] = image;
          });
        }
      }
    }
  }
}
