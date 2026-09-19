import { Hono } from "hono/tiny";
import { getPageHtml } from "./page.js";
import { parseCoords, gcj02ToWgs84, round6 } from "./parse.js";


const app = new Hono();



/*
 * 首页
 */
app.get("/", (c) => {

  return c.html(
    getPageHtml()
  );

});





/*
 * Shadowrocket 模块

 * 地址:
 * https://wloc.openstack.kdns.fr/wloc.module
 */
app.get("/wloc.module", (c) => {


const module = `#!name=以色列野小子虚拟定位
#!desc=WLOC固定虚拟定位
#!author=以色列野小子


[MITM]
hostname = %APPEND% gs-loc.apple.com, gs-loc-cn.apple.com


[Script]
http-response ^https:\\/\\/gs-loc.* script-path=https://wloc.openstack.kdns.fr/wloc.js,requires-body=true

`;



return new Response(module,{

status:200,

headers:{

"Content-Type":"text/plain",

"Content-Disposition":"attachment; filename=wloc.module"

}

});


});








/*
 * Shadowrocket JS脚本

 * 地址:
 * https://wloc.openstack.kdns.fr/wloc.js
 */
app.get("/wloc.js",(c)=>{


const js = `
// 以色列野小子虚拟定位
// WLOC Script


let body = $response.body;


try {


let obj = JSON.parse(body);



if(obj.location){


    // 固定位置
    // 40.067963 116.555886


    obj.location.latitude = 40.067963;


    obj.location.longitude = 116.555886;


}



body = JSON.stringify(obj);



}
catch(e){


console.log(e);


}




$done({

body:body

});


`;



return new Response(js,{

status:200,

headers:{

"Content-Type":"application/javascript"

}

});


});










/*
 * 坐标解析接口

 * /api/parse?u=xxx&format=json
 */
app.get("/api/parse", async (c)=>{


const raw =
c.req.query("u") || "";


const cs =
(c.req.query("cs") || "")
.toLowerCase();



const fmt =
(c.req.query("format") || "")
.toLowerCase();




try{


let {

lat,

lon,

name,

src


} = await parseCoords(raw);





const needConv =

cs === "gcj"

||

(

cs !== "none"

&&

(

src === "amap"

||

src === "apple"

)

);





if(needConv){


({

lat,

lon

}

=

gcj02ToWgs84(
lat,
lon
));


}





lat = round6(lat);

lon = round6(lon);


name = name || "";



c.header(
"Access-Control-Allow-Origin",
"*"
);




if(fmt === "json"){


return c.json({

lat,

lon,

name

});


}





return c.text(

`lat=${lat}&lon=${lon}`

);





}
catch(e){



c.header(
"Access-Control-Allow-Origin",
"*"
);



return c.json({

error:String(

e && e.message

?

e.message

:

e

)

},422);



}



});







/*
 * 错误处理
 */
app.onError((e,c)=>{


console.error(e);


return c.text(

String(e),

500

);


});





export default app;
