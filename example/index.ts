import { Tilemap, TileLayer, MarkerLayer, DomLayer } from "../src";
import { ImageBounds, ImageLayer } from "../src/image-layer";
import { api, fetchAccessToken } from "./api";
import { underground2Maps, underground3Maps, undergroundMaps } from "./data";

async function main() {
  // 渊下宫
  // const size: [number, number] = [12288, 12288],
  // const origin: [number, number] = [3568, 6286],
  const size: [number, number] = [17408, 16384];
  const origin: [number, number] = [3568, 6286];
  const tileOffset: [number, number] = [-5120, 0];
  const tilemap = new Tilemap({
    element: "#tilemap",
    size,
    tileOffset,
    origin,
    maxZoom: 0.5,
  });

  tilemap.tileLayers.add(
    new TileLayer(tilemap, {
      minZoom: 10,
      maxZoom: 13,
      getTileUrl(x, y, z) {
        return `https://assets.yuanshen.site/tiles_twt34/${z}/${x}_${y}.png`;
      },
    })

    // 渊下宫
    // new TileLayer(tilemap, {
    //   minZoom: 10,
    //   maxZoom: 13,
    //   getTileUrl(x, y, z) {
    //     return `https://assets.yuanshen.site/tiles_yxg2/${z}/${x}_${y}.png`;
    //   },
    // })
  );

  // enableUndergroundMaps();

  await fetchAccessToken();
  const { record } = await api("icon/get/list", { size: 1000 });
  const iconSize = 32 * devicePixelRatio;
  const markersMap = new Map<MarkerLayer, any[]>();
  const icons: Record<string, string> = {};
  for (const i of record) {
    icons[i.name] = i.url;
  }

  addMarker(126);
  addMarker(1242);
  addMarker(1561);
  addMarker(97);
  addMarker(159);

  // 渊下宫点位
  // addMarker(660);
  // addMarker(627);

  const activeMarkerLayer = new MarkerLayer(tilemap, {
    positions: [],
    image: new Image(),
  });

  // 点击事件处理
  tilemap.options.onClick = (event) => {
    if (event) {
      const { target, index } = event;
      if (target == activeMarkerLayer) return;

      const { image, positions } = target.options;
      tilemap.markerLayers.add(activeMarkerLayer);
      activeMarkerLayer.options.positions[0] = positions[index];
      activeMarkerLayer.options.image = createActiveMarkerImage(
        image as HTMLCanvasElement
      );

      const marker = markersMap.get(target)![index];
      const markerElement = document.createElement("div");
      markerElement.className = "marker";
      markerElement.innerHTML = `
        <div class="marker-title">${marker.markerTitle}</div>
        <div class="marker-content">${marker.content}</div>
        ${marker.picture ? `<img src="${marker.picture}">` : ""}
      `;
      tilemap.domLayers.clear();
      tilemap.domLayers.add(
        new DomLayer(tilemap, {
          element: markerElement,
          position: positions[index],
        })
      );
      tilemap.draw();
    } else {
      tilemap.markerLayers.delete(activeMarkerLayer);
      tilemap.domLayers.clear();
      tilemap.draw();
    }
  };

  async function addMarker(id: number) {
    const markers = await api("marker/get/list_byinfo", { itemIdList: [id] });
    const markerLayer = new MarkerLayer(tilemap, {
      positions: markers.map((i: any) =>
        i.position.split(",").map((i: string) => parseInt(i))
      ),
      image: createMarkerImage(icons[markers[0].itemList[0].iconTag]),
    });
    markersMap.set(markerLayer, markers);
    tilemap.markerLayers.add(markerLayer);
  }

  function createActiveMarkerImage(image: HTMLCanvasElement) {
    const canvas = document.createElement("canvas")!;
    const canvas2d = canvas.getContext("2d")!;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas2d.drawImage(image, 0, 0);
    return canvas;
  }

  function createMarkerImage(url: string) {
    const canvas = document.createElement("canvas");
    const canvas2d = canvas.getContext("2d")!;
    const image = new Image();
    image.src = url;
    image.addEventListener("load", () => {
      canvas.width = iconSize;
      canvas.height = iconSize;
      const radius = iconSize / 2;
      canvas2d.arc(radius, radius, radius, 0, 2 * Math.PI);
      canvas2d.fillStyle = "rgba(255, 255, 255, 0.5)";
      canvas2d.fill();

      // 图片正方形的情况下 `canvas2d.drawImage(image, 0, 0, iconSize, iconSize)` 就可以了
      let size = [
        image.width * devicePixelRatio,
        image.height * devicePixelRatio,
      ];
      if (image.width > image.height) {
        size = [iconSize, (size[1] * iconSize) / size[0]];
      } else {
        size = [(size[0] * iconSize) / size[1], iconSize];
      }
      const x = (iconSize - size[0]) / 2;
      const y = (iconSize - size[1]) / 2;
      canvas2d.drawImage(image, x, y, size[0], size[1]);
      tilemap.draw();
    });
    return canvas;
  }

  function enableUndergroundMaps() {
    const canvas = document.createElement("canvas");
    const canvas2d = canvas.getContext("2d")!;
    canvas2d.fillStyle = "rgba(0, 0, 0, 0.68)";
    canvas2d.rect(0, 0, canvas.width, canvas.height);
    canvas2d.fill();
    tilemap.imageLayers.add(
      new ImageLayer(tilemap, {
        image: canvas,
        bounds: [
          [-origin[0] + tileOffset[0], -origin[1] + tileOffset[1]],
          size,
        ],
      })
    );

    for (const [_, { imageUrl, imageBounds }] of undergroundMaps) {
      addImageLayer(imageUrl, imageBounds);
    }

    for (const [image, bounds] of underground2Maps) {
      addImageLayer(
        `https://assets.yuanshen.site/overlay/SM/${image}.png`,
        bounds
      );
    }

    for (const [image, bounds] of underground3Maps) {
      addImageLayer(
        `https://assets.yuanshen.site/overlay/${image}.png`,
        bounds
      );
    }
  }

  function addImageLayer(url: string, bounds: ImageBounds) {
    const image = new Image();
    image.src = url;
    image.addEventListener("load", () => tilemap.draw());
    tilemap.imageLayers.add(new ImageLayer(tilemap, { image, bounds }));
  }
}

main();
