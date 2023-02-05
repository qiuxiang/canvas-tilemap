import { Tilemap, TileLayer, MarkerLayer, DomLayer } from "../src";

let accessToken = "";

async function api(path: string, params: Record<string, any> = {}) {
  const response = await fetch(`https://cloud.yuanshen.site/api/${path}`, {
    method: "post",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });
  return (await response.json())["data"];
}

async function fetchAccessToken() {
  const headers = { authorization: "Basic Y2xpZW50OnNlY3JldA==" };
  const response = await fetch(
    "https://cloud.yuanshen.site/oauth/token?scope=all&grant_type=client_credentials",
    { method: "post", headers }
  );
  accessToken = (await response.json())["access_token"];
}

async function main() {
  const tileOffset: [number, number] = [-5120, 0];
  const tilemap = new Tilemap({
    element: "#tilemap",
    size: [17408, 16384],
    origin: [3568, 6286],
    maxZoom: 0.5,
    tileOffset,

    // 渊下宫
    // size: [12288, 12288],
    // origin: [3568, 6286],
  });

  tilemap.tileLayers.add(
    new TileLayer(tilemap, {
      minZoom: 10,
      maxZoom: 13,
      getTileUrl(x, y, z) {
        return `https://assets.yuanshen.site/tiles_twt34/${z}/${x}_${y}.png`;
      },
      dx: 1024,
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

  await fetchAccessToken();
  const { record } = await api("icon/get/list", { size: 1000 });
  const iconSize = 32 * devicePixelRatio;
  const markersMap = new Map<MarkerLayer, any[]>();
  const icons: Record<string, string> = {};
  for (const i of record) {
    icons[i.name] = i.url;
  }

  await addMarker(126);
  // await addMarker(1242);
  // await addMarker(1561);
  // await addMarker(97);
  await addMarker(159);

  // 渊下宫点位
  // await addMarker(660);
  // await addMarker(627);

  const activeMarkerLayer = new MarkerLayer(tilemap, {
    positions: [],
    image: new Image(),
  });
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
}

main();
