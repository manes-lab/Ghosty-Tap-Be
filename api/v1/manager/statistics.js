const moment = require('moment');
const mongoose = require("mongoose");
module.exports = function (app) {

  app.get('/api/v1/statistics/operation', async (ctx, next) => {
    let params = ctx.params
    let Statistics = ctx.model("statistics")
    let userId = params.user_id
    let operation = params.operation
    let msg = params.msg
    await Statistics.createRow({
      user_id: userId, msg: msg, operation: operation, create_at: moment().valueOf(), update_at: moment().valueOf()
    })
    return ctx.body = {code: '200', success: true, msg: 'ok', data: {}}
  })
  app.get('/api/v1/statistics/info', async (ctx, next) => {
    let params = ctx.params
    let Statistics = ctx.model("statistics")
    let total = await Statistics.agg([{$match: {}}, {
      $group: {
        _id: "$operation", lastDocument: {
          $last: "$$ROOT"
        }, count: {$sum: 1}
      }
    }, {
      $project: {_id: 1, count: 1, msg: "$lastDocument.msg"}
    }, {$sort: {"num": -1}},

    ])
    return ctx.body = {code: '200', success: true, msg: 'ok', data: total}
  })
  app.get('/api/v1/statistics/exam', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let startTime = params.start_time
    let endTime = params.end_time
    let type = params.type
    let Examination = ctx.model("examination")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let q = {is_pass: true}
    if (type == 'all') {
      q = {}
    } else {
      q['is_pass'] = true
    }
    if (userId) {
      q['user_id'] = userId
    }
    if (startTime && endTime) {
      q['create_at'] = {$gte: +startTime, $lte: +endTime}
    }
    let rows = await Examination.agg([{$match: q}, {
      $group: {
        _id: "$user_id", count: {$sum: 1}
      }
    }, {$project: {_id: 1, count: 1}}, {$sort: {"count": -1}},])

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows
    }
  })
  app.get('/api/v1/statistics/boostCounts', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let Invitation = ctx.model("invitation")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let rows = await Invitation.getRows({be_invite_user_id: userId})
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows.length
    }
  })

  app.get('/api/v1/statistics/boostMaxCounts', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let Invitation = ctx.model("invitation")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let rows = await Invitation.agg([{$match: {invite_user_id: userId}}, {
      $group: {
        _id: "$num", count: {$sum: 1}
      }
    }, {$project: {_id: 1, count: 1}}, {$sort: {"count": -1}},])
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows
    }
  })

  app.get('/api/v1/statistics/withdraw/maxUsdt', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let Reward = ctx.model("reward")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let usdt = await Reward.agg([{$match: {user_id: userId, is_withdraw: false}}, {
      $group: {
        _id: null, usdt: {$sum: "$usdt"}, count: {$sum: 1}
      }
    }, {$project: {usdt: 1, count: 1}}, {$sort: {"count": -1}},])
    let maxUsdt = usdt.length > 0 ? usdt[0]['usdt'] : 0
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: maxUsdt
    }
  })
  app.get('/api/v1/statistics/addWhitelist', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let Whitelist = ctx.model("whitelist")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    await Whitelist.createRow({
      user_id: userId
    })
    let rows = await Whitelist.getRows({})
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows
    }
  })

  app.get('/api/v1/statistics/boostCountAndActivityCount', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let Invitation = ctx.model("invitation")
    let Activity = ctx.model("activity")
    let User = ctx.model("user")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let boostCount = await Invitation.getRowsCount({
      be_invite_user_id: userId
    })
    let total_boostCount = await Invitation.getRowsCount({})
    let activityCount = await Activity.getRowsCount({user_id: userId})
    let total_activityCount = await Activity.getRowsCount({})

    let rows = await User.getRows({})
    let n = []
    for (let i = 0; i < rows.length; i++) {
      let boostCount = await Invitation.getRowsCount({
        be_invite_user_id: rows[i]['user_id']
      })
      let activityCount = await Activity.getRowsCount({user_id: rows[i]['user_id']})
      n.push({
        user_id: rows[i]['user_id'],
        "first_name": rows[i]['first_name'],
        "username": rows[i]['username'],
        boostCount: boostCount,
        activityCount: activityCount
      })
    }

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        boostCount: boostCount,
        activityCount: activityCount,
        total_boostCount: total_boostCount,
        total_activityCount: total_activityCount,
        total: n
      }
    }
  })

  app.get('/api/v1/statistics/reward/getUsers', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let startTime = params.startTime
    let endTime = params.endTime
    let Reward = ctx.model("reward")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let q = {coins: {$ne: 0}}
    if (startTime) {
      q['create_at'] = {$gte: +startTime, $lte: +endTime}
    }
    let usdt = await Reward.agg([{$match: q}, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {user_count: usdt.length, users_info: usdt}
    }
  })


  app.get('/api/v1/statistics/reward/consecutiveWinsCountAndTotalCoins', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let key = params.key
    let Reward = ctx.model("reward")
    let GameData = ctx.model("gameData")
    let Game = ctx.model("game")
    let User = ctx.model("user")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }

    let q = {}
    if (userId) {
      q['user_id'] = userId
    }

    let consecutiveWins = await Reward.getLimitRows(q, {consecutive_wins_count: -1}, 1)
    let consecutiveWinsCount = consecutiveWins.length > 0 ? consecutiveWins[0]['consecutive_wins_count'] : 0

    let totalCoins = await Reward.agg([{
      $match: {
        ...q,
      }
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

    let zenCoins = await Reward.agg([{
      $match: {
        ...q, type: "zen_game"
      }
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
    let adventureCoins = await Reward.agg([{
      $match: {
        ...q, type: "adventure_game"
      }
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
    let totalGameCount = await GameData.getRowsCount(q)
    let totalUserCount = await User.getRowsCount({})
    let zen =await Game.getRowsCount({type:"zen"})
    let adventure =await Game.getRowsCount({type:"adventure"})
    let adventureVictoryCount = await Reward.getRowsCount({type: "adventure_game",coins:{$gt:0}})
    let adventureFailCount = await Reward.getRowsCount({type: "adventure_game",coins:{$lt:0}})

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        consecutiveWinsCount: consecutiveWinsCount,
        totalCoins: totalCoins.length > 0 ? totalCoins[0]['coins'] : 0,
        zenCoins: zenCoins.length > 0 ? zenCoins[0]['coins'] : 0,
        adventureCoins: adventureCoins.length > 0 ? adventureCoins[0]['coins'] : 0,
        totalAdventureGameCount: totalGameCount,
        totalUserCount:totalUserCount,
        zenCount:zen,
        adventureCount:adventure,
        adventureVictoryCount:adventureVictoryCount,
        adventureFailCount:adventureFailCount,

      }
    }
  })

}
