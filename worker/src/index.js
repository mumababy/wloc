import { Hono } from "hono/tiny";
import { getPageHtml } from "./page.js";
import { parseCoords, gcj02ToWgs84, round6 } from "./parse.js";

const app = new Hono();


/*
 * 首页
 */
app.get("/", (c) => {
  return c.html(getPageHtml());
});


/*
 * Shadowrocket 模块下载
 *
 * 地址:
 * https://wloc.openstack.kdns.fr/wloc.module
 */
app.get("/wloc.module", (c) => {

  const module = `#!name=以色列野小子虚拟定位
#!desc=WLOC 虚拟定位模块
#!author=yiselieyexiaozi

[MITM]
hostname = %APPEND% gs-loc.apple.com, gs-loc-cn.apple.com

[Script]

`;

  return c.text(module, 200, {
    "Content-Type": "text/plain; charset=utf-8"
  });
});



/*
 * Map link parsing
 *
 * GET:
 * /api/parse?u=<link>&format=json&cs=<gcj|none>
 *
 * Returns:
 * {
 *   lat,
 *   lon,
 *   name
 * }
 */
app.get("/api/parse", async (c) => {

  const raw = c.req.query("u") || "";
  const cs = (c.req.query("cs") || "").toLowerCase();
  const fmt = (c.req.query("format") || "").toLowerCase();


  try {

    let {
      lat,
      lon,
      name,
      src
    } = await parseCoords(raw);



    /*
     * 坐标转换
     *
     * 高德 / Apple 中国区默认 GCJ02
     * 转 WGS84
     */
    const needConv =
      cs === "gcj" ||
      (
        cs !== "none" &&
        (
          src === "amap" ||
          src === "apple"
        )
      );


    if (needConv) {
      ({
        lat,
        lon
      } = gcj02ToWgs84(lat, lon));
    }



    lat = round6(lat);
    lon = round6(lon);

    name = name || "";


    c.header(
      "Access-Control-Allow-Origin",
      "*"
    );


    if (fmt === "json") {

      return c.json({
        lat,
        lon,
        name
      });

    }


    return c.text(
      `lat=${lat}&lon=${lon}`
    );


  } catch (e) {

    c.header(
      "Access-Control-Allow-Origin",
      "*"
    );


    return c.json(
      {
        error: String(
          e && e.message
            ? e.message
            : e
        )
      },
      422
    );

  }

});



/*
 * 全局错误处理
 */
app.onError((e, c) => {

  console.error(`${e}`);

  return c.text(
    `${e}`,
    500
  );

});


export default app;
