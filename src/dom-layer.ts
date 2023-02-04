import { Layer, Tilemap } from "./tilemap";

export interface DomLayerOptions {
  element: HTMLElement;
  position: [number, number];
}

export class DomLayer extends Layer {
  map: Tilemap;
  options: DomLayerOptions;
  element: HTMLElement;

  constructor(map: Tilemap, options: DomLayerOptions) {
    super();
    this.map = map;
    this.options = options;
    this.element = document.createElement("div");
    this.element.style.position = "absolute";
    this.element.style.top = "0";
    this.element.style.left = "0";
    this.element.appendChild(options.element);
    this.map.element.appendChild(this.element);
    this.draw();
  }

  draw() {
    this.element.style.transform = `translate(0, 0)`;
  }
}
