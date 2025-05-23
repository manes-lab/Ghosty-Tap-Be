const moment = require('moment');
const response = async (ctx, next) => {
    let fgYellow = "\x1b[33m%s\x1b[0m";
    let fgBlue = "\x1b[34m%s\x1b[0m";
    let fgGreen = "\x1b[32m%s\x1b[0m";
    let params = ctx.params
    let url = ctx.request.url
    let method = ctx.request.method
     let t =moment().valueOf()
    console.log(fgYellow, "request url:" + "  " + method + "  " + url );
    console.log(fgBlue, "request params :" + JSON.stringify(params));

    await next();
    console.log(fgGreen, "response url:" + "  " + method + "  " + url ," "+(moment().valueOf()-t)+"ms");

    // 修改响应数据
    if (ctx.status === 200 && ctx.body) {
        try {
            let Log = ctx.model("log")
            await Log.createRow({params: params, url: url, headers: ctx.req.headers,result:ctx.body})
        } catch (e) {
        }
    }
};



module.exports = response
