const moment = require("moment");
const mongoose = require("mongoose");
const {eventEmitterListenerCount} = require("websocket/lib/utils");
module.exports = function (app) {
  app.get('/api/v1/battle/getBars', async (ctx, next) => {
    let params = ctx.params
    let battleId = params.battle_id
    let Room = ctx.model("room")
    let User = ctx.model("user")
    let Battle = ctx.model("battleBars")

    let battle = await Battle.getRow({battle_id: mongoose.Types.ObjectId(battleId)})
    if (!battle) {
      return ctx.body = {
        code: '200', success: false, msg: 'battle not found'
      }
    }

    return ctx.body = {
      code: '200', success: false, msg: 'ok', data: battle.bars
    }
  })
  app.get('/api/v1/battle/settlement', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let battleId = params.battle_id
    let Room = ctx.model("room")
    let User = ctx.model("user")
    let Battle = ctx.model("battle")
    let GameDataBattle = ctx.model("gameDataBattle")
    //Available
    //Playing
    let battle = await Battle.getRow({_id: mongoose.Types.ObjectId(battleId)})
    if (!battle) {
      return ctx.body = {
        code: '200', success: false, msg: 'battle not found'
      }
    }
    let rows1 = await GameDataBattle.getRows({
      user_id: battle.invite_user_id, battle_id: battle['_id']
    }, {_id: 1})

    let rows2 = await GameDataBattle.getRows({
      user_id: battle.be_invite_user_id, battle_id: battle['_id']
    }, {_id: 1})


    let battle_history1 = []
    let battle_history2 = []
    for (let i = 0; i < rows1.length; i++) {
      battle_history1.push({
        user_id: rows1[i].user_id, is_success: rows1[i].is_success
      })

    }
    for (let i = 0; i < rows2.length; i++) {
      battle_history2.push({
        user_id: rows2[i].user_id, is_success: rows2[i].is_success
      })

    }
    if (userId == battle.be_invite_user_id) {
      battle.status =(battle.status=='draw')?'draw': ((battle.status == 'fail') ? "success" : "fail")
    }

    if (battle.status == 'draw') {
      battle.coins = "0"
    } else if (battle.status == 'fail') {
      battle.coins = '-' + battle.coins
    } else {
      battle.coins = '+' + battle.coins
    }
  let is_leave =false
    if (battle.status== 'fail') {
      if (battle_history1.length<10){
        is_leave=true
      }

    }
    if (battle.status== 'success') {
      if (battle_history2.length<10){
        is_leave=true
      }

    }
    let user1 = await User.getRow({user_id: battle.invite_user_id})
    let user2 = await User.getRow({user_id: battle.be_invite_user_id})
    if (userId == battle.invite_user_id) {
      return ctx.body = {
        code: '200', success: true, msg: 'ok', data: {
          is_leave:is_leave,
          battle: battle,
          record: [{
            user: user1, battle_history: battle_history1
          }, {
            user: user2, battle_history: battle_history2
          }]
        }
      }

    } else {
      return ctx.body = {
        code: '200', success: true, msg: 'ok', data: {
          battle: battle,
          is_leave:is_leave,
          record: [{
            user: user2, battle_history: battle_history2
          }, {
            user: user1, battle_history: battle_history1
          }]
        }
      }
    }


  })

  app.get('/api/v1/battle/history', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let battleId = params.battle_id
    let Room = ctx.model("room")
    let GameDataBattle = ctx.model("gameDataBattle")
    let Mail = ctx.model("mail")
    let User = ctx.model("user")
    let Battle = ctx.model("battle")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let now = moment().valueOf()
    let list = await Battle.getPagedRows({$or: [{invite_user_id: userId}, {be_invite_user_id: userId}]}, page * limit, limit, {_id: -1})

    let user = await User.getRow({user_id: userId})
    //status 有3个值 success 赢 fail  输  draw（平局）
    for (let i = 0; i < list.length; i++) {
      list[i].user = user
      if (list[i].be_invite_user_id == userId) {
        if (list[i].status == 'fail') {
          list[i].status = 'success'
        }
        let u = await User.getRow({user_id: list[i].invite_user_id})
        list[i].battle_user = u
      } else {
        let u = await User.getRow({user_id: list[i].be_invite_user_id})
        list[i].battle_user = u
      }
      if (list[i].status == 'draw') {
        list[i].coins = "0"
      } else if (list[i].status == 'fail') {
        list[i].coins = '-' + list[i].coins
      } else {
        list[i].coins = '+' + list[i].coins
      }

    }
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: list
    }


  })


}
