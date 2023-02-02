import { Tilemap, TileLayer } from "../src";

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
  });

  tilemap.tileLayers.push(
    new TileLayer(tilemap, {
      minZoom: 10,
      maxZoom: 13,
      offset: [-5120, 0],
      getTileUrl(x, y, z) {
        return `https://assets.yuanshen.site/tiles_twt34/${z}/${x}_${y}.png`;
      },
    })
  );

  await fetchAccessToken();
  const data = await api("marker/get/list_byinfo", { itemIdList: [122] });
  console.log(data);
}

main();
