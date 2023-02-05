import { Layer, Tilemap } from ".";
import { safeCeil } from "./utils";

export interface TileLayerOptions {
  minZoom: number;
  maxZoom: number;
  getTileUrl: (x: number, y: number, z: number) => string;

  /**
   * default: 256
   */
  tileSize?: number;
}

export class TileLayer extends Layer {
  map: Tilemap;
  options: TileLayerOptions;
  tiles: Record<number, string[][]> = {};
  images: Record<string, HTMLImageElement> = {};

  constructor(map: Tilemap, options: TileLayerOptions) {
    super();
    this.map = map;
    this.options = {
      ...options,
      tileSize: options.tileSize ?? 256,
    };
    const { size: mapSize, tileOffset } = map.options;
    const { minZoom, maxZoom, tileSize } = this.options;
    for (let z = minZoom; z <= maxZoom; z += 1) {
      const imageSize = tileSize! * 2 ** (maxZoom - z);
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
    const { minZoom, maxZoom } = this.options;
    this.drawTiles(minZoom);

    let zoom = maxZoom + Math.log2(this.map.scale);
    zoom = safeCeil(Math.min(Math.max(zoom, minZoom), maxZoom));
    if (zoom > minZoom) {
      this.drawTiles(zoom);
    }
  }

  drawTiles(z: number) {
    const tiles = this.tiles[z];
    const { scale, offset, size, options } = this.map;
    const tileSize = this.options.tileSize! * 2 ** (this.options.maxZoom - z);
    const imageSize = tileSize * scale;
    const dx = (options.size[0] % tileSize) * scale;
    const startX = Math.floor(-offset[0] / imageSize);
    const endX = safeCeil((size[0] - offset[0] + dx) / imageSize);
    const startY = Math.floor(-offset[1] / imageSize);
    const endY = safeCeil((size[1] - offset[1]) / imageSize);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const url = tiles[y][x];
        const image = this.images[tiles[y][x]];
        if (image) {
          this.map.canvas2d.drawImage(
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
