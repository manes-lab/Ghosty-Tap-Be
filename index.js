const Koa = require('koa');
const app = new Koa();
const config = require('config');
const { initServer, initClient } = require('./plugins/websocket');
const verify = require('./plugins/verify.js')
const response = require('./plugins/response.js')
const timer =require('./libraries/schedule/timer')
global.config = config;
const Router = require('koa-router');
const router = new Router();

const bodyParser = require('koa-bodyparser');

app.use(bodyParser());

app.use(async (ctx, next) => {
  ctx.params = {
    ...ctx.request.body,
    ...ctx.query
  };
  await next();
});

let mongodb_conf = config.get('mongodb');
mongodb_conf['schemas'] = __dirname + '/models';
app.use(require('./plugins/mongoose')(mongodb_conf));
app.use(verify)
app.use(response);
if (process.env.NODE_ENV == 'timer'||process.env.NODE_ENV == 'dev') {
  timer.start(require('./plugins/mongoose').models)
}

function loadActions(dir) {
  let fs = require('fs');
  let path = require('path');
  let files = fs.readdirSync(dir);
  for (var file in files) {
    let p = dir + "/" + files[file];
    let stat = fs.lstatSync(p);
    if (stat.isDirectory() == true) {
      loadActions(p);
    } else {
      if (path.extname(p) == '.js') {
        require(p)(router);
      }
    }
  }
}

loadActions(__dirname + "/api");

app.use(router.routes()).use(router.allowedMethods());
const port = Number(config.get('port')) + Number(process.env.NODE_APP_INSTANCE)
app.listen(port, () => {
    console.log('The server is running at http://localhost:' + port);
});

//initServer()
//initClient()

