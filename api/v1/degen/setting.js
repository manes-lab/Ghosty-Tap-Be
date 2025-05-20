const moment = require("moment");
const mongoose = require("mongoose");
module.exports = function (app) {
  app.post('/api/v1/setting/setNotice', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let adventureRefuse = params.adventure_refuse
    let pkRefuse = params.pk_refuse
    let System = ctx.model("system")
    await System.updateOrInsertRow({user_id: userId}, {
      adventure_refuse:adventureRefuse,
      pk_refuse:pkRefuse
    })
    let row = await System.getRow({user_id: userId})
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: row
    }
  })
  app.get('/api/v1/setting/getSetNotice', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let System = ctx.model("system")
    let row = await System.getRow({user_id: userId})
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: row
    }

  })

}
