const config = require("config");
const moment = require('moment');
module.exports = function (app) {
  app.get('/api/v1/reward/list', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let rewards = await Reward.getPagedRows({user_id: userId}, page * limit, limit, {create_at: -1})
    ctx.body = {code: '200', success: true, msg: 'ok', data: rewards}
  })

  app.get('/api/v1/reward/pond', async (ctx, next) => {
    let params = ctx.params
    let Pond = ctx.model("pond")
    let ponds = await Pond.getRows({})
    ctx.body = {code: '200', success: true, msg: 'ok', data: ponds}
  })

  app.get('/api/v1/reward/getPonds', async (ctx, next) => {
    let params = ctx.params
    let Pond = ctx.model("pond")
    let ponds = await Pond.getRows({})
    ctx.body = {code: '200', success: true, msg: 'ok', data: ponds}
  })

}
