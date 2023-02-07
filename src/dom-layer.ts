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
    this.element.addEventListener("click", (event) => {
      if (event.target != this.element) {
        event.stopPropagation();
      }
    });
    this.map.element.appendChild(this.element);
    this.draw();

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { blockSize, inlineSize } = entry.borderBoxSize[0];
      this.element.style.width = `${inlineSize}px`;
      this.element.style.height = `${blockSize}px`;
    });
    resizeObserver.observe(options.element);
  }

  draw() {
    const [x, y] = this.map.toCanvasPositionWithOffset(this.options.position);
    this.element.style.transform = `translate(${x}px, ${y}px)`;
  }
}
