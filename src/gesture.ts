import { FullGestureState, Gesture as UseGesture } from "@use-gesture/vanilla";
import { inertia } from "popmotion";
import { CanvasTilemap } from ".";

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
  map: CanvasTilemap;

  initialScale = 0;
  lastPinchTime = 0;
  lastWheelTime = 0;
  lastClickTime = 0;
  lastDragTime = 0;

  scaleAnimation = inertia({});
  offsetAnimation = [inertia({}), inertia({})];
  velocityX = new Average();
  velocityY = new Average();
  velocityScale = new Average();

  constructor(map: CanvasTilemap) {
    this.map = map;
    new UseGesture(this.map.element, {
      onWheel: this.onWheel.bind(this),
      onPinch: this.onPinch.bind(this),
      onPinchEnd: this.onPinchEnd.bind(this),
      onDragStart: this.onDragStart.bind(this),
      onDrag: this.onDrag.bind(this),
      onDragEnd: this.onDragEnd.bind(this),
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
    const { origin, da, initial, touches, timeStamp, } = state
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
    this.velocityX.clear();
    this.velocityY.clear();
  }

  onDrag(state: FullGestureState<"drag">) {
    const { pinching, wheeling, timeStamp, velocity, delta } = state;
    if (pinching || wheeling || timeStamp - this.lastPinchTime < 200) {
      return;
    }

    this.velocityX.add(velocity[0]);
    this.velocityY.add(velocity[1]);
    this.setOffset(0, this.map.offset[0] + delta[0]);
    this.setOffset(1, this.map.offset[1] + delta[1]);
    this.map.draw();
  }

  async onDragEnd(state: FullGestureState<"drag">) {
    const { direction, timeStamp, distance } = state;
    if (timeStamp - this.lastPinchTime < 200) return;

    const initialOffset = [...this.map.offset];
    const velocity = [this.velocityX.value, this.velocityY.value];
    const animateOffset = (index: number) => {
      this.offsetAnimation[index] = inertia({
        velocity: velocity[index],
        power: 200,
        timeConstant: 200,
        onUpdate: (value) => {
          this.setOffset(
            index,
            initialOffset[index] + direction[index] * value
          );
          this.map.draw();
        },
      });
    };
    animateOffset(0);
    animateOffset(1);
    if (distance[0] > 2 || distance[1] > 2) {
      this.lastDragTime = timeStamp;
    }
  }

  scaleTo(newScale: number, origin: [number, number]) {
    const { offset, scale, minZoom, options } = this.map;
    let zoom = Math.log2(newScale);
    zoom = Math.max(Math.min(zoom, options.maxZoom!), minZoom);
    newScale = 2 ** zoom;
    const ratio = (newScale - scale) / scale;
    this.map.scale = newScale;
    this.setOffset(0, offset[0] - (origin[0] - offset[0]) * ratio);
    this.setOffset(1, offset[1] - (origin[1] - offset[1]) * ratio);
    this.map.draw();
  }

  setOffset(index: number, value: number) {
    const { size, options, offset, scale } = this.map;
    const maxValue = size[index] - options.size[index] * scale;
    offset[index] = Math.min(Math.max(value, maxValue), 0);
  }
}
