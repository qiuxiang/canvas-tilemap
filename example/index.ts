import { Tilemap, TileLayer, MarkerLayer } from "../src";

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
  const tilemap = new Tilemap({
    element: "#canvas",
    size: [17408, 16384],
    origin: [3568, 6286],
    maxZoom: 0.5,

    // 渊下宫
    // size: [12288, 12288],
    // origin: [3568, 6286],
  });

  tilemap.tileLayers.add(
    new TileLayer(tilemap, {
      minZoom: 10,
      maxZoom: 13,
      offset: [-5120, 0],
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
  const iconSize = 32;
  const icons: Record<string, string> = {};
  for (const i of record) {
    icons[i.name] = i.url;
  }

  await addMarker(126);
  await addMarker(1242);
  await addMarker(1561);
  await addMarker(97);
  // 渊下宫点位
  // await addMarker(660);
  // await addMarker(627);

  async function addMarker(id: number) {
    const markers = await api("marker/get/list_byinfo", { itemIdList: [id] });
    tilemap.markerLayers.add(
      new MarkerLayer(tilemap, {
        positions: markers.map((i: any) =>
          i.position.split(",").map((i: string) => parseInt(i))
        ),
        image: createMarkerImage(icons[markers[0].itemList[0].iconTag]),
        offset: [-5120, 0],
      })
    );
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
      // 图片都是正方形的情况下 `canvas2d.drawImage(image, 0, 0, iconSize, iconSize)` 就可以了
      let size = [image.width, image.height];
      if (image.width > image.height) {
        size = [iconSize, (size[1] * iconSize) / size[0]];
      } else {
        size = [(size[0] * iconSize) / size[1], iconSize];
      }
      canvas2d.drawImage(
        image,
        (iconSize - size[0]) / 2,
        (iconSize - size[1]) / 2,
        size[0],
        size[1]
      );
      tilemap.draw();
    });
    return canvas;
  }
}

main();
