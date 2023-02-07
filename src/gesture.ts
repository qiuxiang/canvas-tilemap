import { FullGestureState, Gesture as UseGesture } from "@use-gesture/vanilla";
import { inertia } from "popmotion";
import { Tilemap } from ".";

export class Average {
  count = 0;
  length = 0;
  data: number[] = [];

  constructor(length = 3) {
    this.length = length;
  }

  add(value: number) {
    this.data[this.count % this.length] = value;
    this.count += 1;
  }

  clear() {
    this.data = Array(length);
  }

  get value() {
    const data = this.data.filter((i) => i != undefined);
    if (data.length == 0) return 0;
    return data.reduce((value, i) => value + i, 0) / data.length;
  }
}

export class Gesture {
  map: Tilemap;

  initialScale = 0;
  lastPinchTime = 0;
  lastWheelTime = 0;
  lastClickTime = 0;
  lastDragTime = 0;

  scaleAnimation = inertia({});
  offsetAnimation = [inertia({}), inertia({})];
  velocity = [new Average(), new Average()];
  velocityScale = new Average();

  constructor(map: Tilemap) {
    this.map = map;
    new UseGesture(this.map.element, {
      onWheel: this.onWheel.bind(this),
      onPinchStart: () => (this.initialScale = this.map.scale),
      onPinch: this.onPinch.bind(this),
      onPinchEnd: this.onPinchEnd.bind(this),
      onDragStart: this.onDragStart.bind(this),
      onDrag: this.onDrag.bind(this),
      onDragEnd: this.onDragEnd.bind(this),
      onClick: this.onClick.bind(this),
    });
  }

  onWheel({ direction, event, delta, timeStamp }: FullGestureState<"wheel">) {
    if (timeStamp == this.lastWheelTime) return;

    this.offsetAnimation[0]?.stop();
    this.offsetAnimation[1]?.stop();
    this.scaleAnimation?.stop();
    this.lastWheelTime = timeStamp;
    const lastScale = this.map.scale;
    this.scaleAnimation = inertia({
      velocity: Math.log2(1 + Math.abs(delta[1]) / 200) / 2,
      power: 2,
      timeConstant: 50,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = Math.log2(lastScale) - direction[1] * value;
        this.scaleTo(2 ** zoom, [event.x, event.y]);
      },
    });
  }

  onPinch(state: FullGestureState<"pinch">) {
    const { origin, da, initial, touches, timeStamp } = state;
    if (touches != 2) return;

    this.lastPinchTime = timeStamp;
    const newScale = (da[0] / initial[0]) * this.initialScale;
    this.velocityScale.add(newScale - this.map.scale);
    this.scaleTo(newScale, origin);
  }

  onPinchEnd({ origin }: FullGestureState<"pinch">) {
    const value = this.velocityScale.value;
    const direction = value > 0 ? -1 : 1;
    this.initialScale = this.map.scale;
    const velocity = Math.log10(1 + Math.abs(this.velocityScale.value)) * 50;
    this.scaleAnimation?.stop();
    this.scaleAnimation = inertia({
      velocity: velocity,
      timeConstant: 50,
      restDelta: 0.001,
      onUpdate: (value) => {
        const zoom = Math.log2(this.initialScale) - direction * value;
        this.scaleTo(2 ** zoom, origin);
      },
    });
  }

  onDragStart() {
    this.offsetAnimation[0]?.stop();
    this.offsetAnimation[1]?.stop();
    this.scaleAnimation?.stop();
    this.velocity[0].clear();
    this.velocity[1].clear();
  }

  onDrag(state: FullGestureState<"drag">) {
    const { pinching, wheeling, timeStamp, velocity, delta } = state;
    if (pinching || wheeling || timeStamp - this.lastPinchTime < 200) {
      return;
    }

    this.velocity[0].add(velocity[0]);
    this.velocity[1].add(velocity[1]);
    this.setOffset([
      this.map.offset[0] + delta[0],
      this.map.offset[1] + delta[1],
    ]);
  }

  async onDragEnd(state: FullGestureState<"drag">) {
    const { direction, timeStamp, distance } = state;
    if (timeStamp - this.lastPinchTime < 200) return;

    const initialOffset = [...this.map.offset];
    const velocity = [this.velocity[0].value, this.velocity[1].value];
    const v = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2);
    if (v != 0) {
      this.offsetAnimation[0] = inertia({
        velocity: v,
        power: 200,
        timeConstant: 200,
        onUpdate: (value) => {
          this.setOffset([
            initialOffset[0] + direction[0] * value * (velocity[0] / v),
            initialOffset[1] + direction[1] * value * (velocity[1] / v),
          ]);
        },
      });
    }
    if (distance[0] > 2 || distance[1] > 2) {
      this.lastDragTime = timeStamp;
    }
  }

  onClick({ event }: { event: MouseEvent }) {
    if (event.timeStamp == this.lastDragTime) return;

    const doubleClickDelay = 200;
    if (event.timeStamp - this.lastClickTime < doubleClickDelay) {
      const lastScale = this.map.scale;
      this.scaleAnimation?.stop();
      this.scaleAnimation = inertia({
        velocity: 1,
        power: 1,
        timeConstant: 100,
        restDelta: 0.001,
        onUpdate: (value) => {
          const zoom = Math.log2(lastScale) + value;
          this.scaleTo(2 ** zoom, [event.x, event.y]);
        },
      });
    } else {
      setTimeout(() => {
        if (event.timeStamp == this.lastClickTime) {
          this.onClickTilemap([event.x, event.y]);
        }
      }, doubleClickDelay);
    }
    this.lastClickTime = event.timeStamp;
  }

  onClickTilemap(position: [number, number]) {
    const result = this.map.findMarker(position);
    if (result) {
      result?.[0].options.onClick?.(result[1]);
      this.map.options.onClick?.({ target: result[0], index: result[1] });
      return;
    }
    this.map.options.onClick?.();
  }

  limitScale(newScale: number) {
    const { minZoom, options } = this.map;
    let zoom = Math.log2(newScale);
    zoom = Math.max(Math.min(zoom, options.maxZoom!), minZoom);
    return 2 ** zoom;
  }

  scaleTo(newScale: number, origin: [number, number]) {
    const { offset, scale } = this.map;
    newScale = this.limitScale(newScale);
    const ratio = (newScale - scale) / scale;
    this.map.scale = newScale;
    this.setOffset([
      offset[0] - (origin[0] - offset[0]) * ratio,
      offset[1] - (origin[1] - offset[1]) * ratio,
    ]);
  }

  setOffset(value: [number, number]) {
    const { size, options, offset, scale } = this.map;
    const max = [
      size[0] - options.size[0] * scale,
      size[1] - options.size[1] * scale,
    ];
    offset[0] = Math.min(Math.max(value[0], max[0]), 0);
    offset[1] = Math.min(Math.max(value[1], max[1]), 0);
    this.map.draw();
  }
}
