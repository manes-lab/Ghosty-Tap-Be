const config = require("config");
const {checkMember} = require('../../utils/telegram/api');
const moment = require('moment');
const crypto = require('crypto');
const setting = require("./setting/setting.json");
const setDegen = require("./setting/degen.json");
const {getRandomInt, generateCaptcha} = require("../../utils/utils")
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable
module.exports = function (app) {


  app.get('/api/v1/settlement/remove', async (ctx, next) => {
    let params = ctx.params
       return
    let Invitation = ctx.model("invitation")
    let Reward = ctx.model("reward")
    let User = ctx.model("user")
    let Game = ctx.model("game")
    let GameData = ctx.model("gameData")
    let Room = ctx.model("room")
    let ZenCd = ctx.model("zenCd")
    let Battle = ctx.model("battle")
    let GameDataBattle = ctx.model("gameDataBattle")
    let InvitationBattle = ctx.model("invitationBattle")
    let Mail = ctx.model("mail")
    let Block = ctx.model("block")

    await Invitation.deleteRows({})
    await Reward.deleteRows({})
    await User.deleteRows({})
    await Game.deleteRows({})
    await GameData.deleteRows({})
    await Room.deleteRows({})
    await Battle.deleteRows({})
    await GameDataBattle.deleteRows({})
    await InvitationBattle.deleteRows({})
    await Mail.deleteRows({})
    await Block.deleteRows({})

    return ctx.body = {code: '200', success: true, msg: 'ok', data: {is_used: false}}
  })

  app.get('/api/v1/user/getInviteCode', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let InviteCode = ctx.model("InviteCode")
    if (!userId) {
      return ctx.body = {
        code: '200', success: false, msg: 'user_id must', data: {}
      }
    }
    let User = ctx.model("user")
    let u = await User.getRow({user_id: userId})
    if (!u || !u.first_name) {
      await User.updateOrInsertRow({user_id: userId}, {
        first_name: params.first_name,
        last_name: params.last_name,
        username: params.username,
        is_follow: false,
        avatar: getRandomInt(1, 5) + "",
        is_join: false,
        channel_id: config.get('telegram').CHANNEL_ID,
        photo_url: params.photo_url,
      })
    }

    let row = await InviteCode.getRow({user_id: userId})
    if (row) {
      return ctx.body = {code: '200', success: true, msg: 'ok', data: {code: row.code}}
    } else {
      let code = generateCaptcha(8);
      await InviteCode.updateOrInsertRow({user_id: userId}, {code: code, user_id: userId})
      let row = await InviteCode.getRow({user_id: userId})
      ctx.body = {code: '200', success: true, msg: 'ok', data: {code: row.code}}
    }
  })


  app.get('/api/v1/user/initUser', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let User = ctx.model("user")
    let rows = await User.getRows({})
    for (let i = 0; i < rows.length; i++) {
      console.log(i);
      await User.updateOrInsertRow({user_id: rows[i].user_id}, {
        avatar: getRandomInt(1, 5) + "",
      })
    }


    ctx.body = {code: '200', success: true, msg: 'ok', data: {}}
  })

  app.get('/api/v1/user/getTegenTabUser', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let User = ctx.model("user")
    let row = await User.getRow({user_id: userId})
    if (row) {
      return ctx.body = {code: '200', success: true, msg: '', data: {}}
    }

    return ctx.body = {code: '200', success: false, msg: '', data: {}}
  })
  app.get('/api/v1/user/getTegenTabUserConsecutiveWins', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let consecutiveWins = await Reward.getLimitRows({user_id: userId}, {consecutive_wins_count: -1}, 1)
    let consecutiveWinsCount = consecutiveWins.length > 0 ? consecutiveWins[0]['consecutive_wins_count'] : 0

    return ctx.body = {code: '200', success: true, msg: '', data: consecutiveWinsCount}
  })

  app.get('/api/v1/user/getBettingCount', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let GameData = ctx.model("gameData")
    let count = await GameData.getRowsCount({user_id: userId,is_success:{$ne:3}})
    return ctx.body = {code: '200', success: true, msg: '', data: count}
  })

  app.get('/api/v1/user/getTegenTabUserCoins', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let totalCoins = await Reward.agg([{
      $match: {user_id: userId}
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
    return ctx.body = {code: '200', success: true, msg: '', data: totalCoins.length > 0 ? totalCoins[0]['coins'] : 0}
  })

  app.get('/api/v1/user/getBettingCount', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let GameData = ctx.model("gameData")
    let count = await GameData.getRowsCount({user_id: userId,is_success:{$ne:3}})
    return ctx.body = {code: '200', success: true, msg: '', data: count}
  })

  app.get('/api/v1/user/getTegenTabUser', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let User = ctx.model("user")
    let row = await User.getRow({user_id: userId})
    if (row) {
      return ctx.body = {code: '200', success: true, msg: '', data: {}}
    }

    return ctx.body = {code: '200', success: false, msg: '', data: {}}
  })
  app.get('/api/v1/user/withdrawToTegen', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let coins = params.coins
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    let row = await User.getRow({user_id: userId})
    if (row) {
      await Reward.createRow({
        user_id: userId,
        game_id: '',
        type: 'withdraw_okcan',
        trading_pair: 'withdraw',
        trade_no: '',
        end_time: moment().valueOf(),
        consecutive_wins_count: 0,
        coins: coins,
      })
      return ctx.body = {code: '200', success: true, msg: '', data: {}}
    }

    return ctx.body = {code: '200', success: false, msg: '', data: {}}
  })


  app.get('/api/v1/user/getTest', async (ctx, next) => {
    let params = ctx.params
    var pomelo = require('../../libraries/pomelo-client');
    var host = "127.0.0.1";
    var port = "3014";
    var route = 'gate.gateHandler.queryEntry';
    pomelo.init({
      host: host, port: port, log: true
    }, function () {
      pomelo.request(route, {uid: '1'}, function (data) {
        console.log(data);
      });
    });

    ctx.body = {code: '200', success: true, msg: 'ok', data: {code: {}}}
  })

  /*
    app.get('/api/v1/user/clear', async (ctx, next) => {
      let params = ctx.params
      let userId = params.user_id
      let Activity = ctx.model("activity")
      let Box = ctx.model("box")
      let Invitation = ctx.model("invitation")
      let Reward = ctx.model("reward")
      await Activity.deleteRows({user_id: userId})
      await Invitation.deleteRows({invite_user_id: userId})
      await Invitation.deleteRows({be_invite_user_id: userId})
      await Box.deleteRows({user_id: userId})
      await Reward.deleteRows({user_id: userId})

      ctx.body = {code: '200', success: true, msg: 'ok', data: {}}
    })
  */

  app.get('/api/v1/user/getUserForCode', async (ctx, next) => {
    let params = ctx.params
    let code = params.code
    let InviteCode = ctx.model("InviteCode")
    let User = ctx.model("user")
    let invite = await InviteCode.getRow({code: code})
    if (!invite) {
      return ctx.body = {code: '200', success: false, msg: 'code error', data: {}}
    }
    let row = await User.getRow({user_id: invite.user_id})
    ctx.body = {code: '200', success: true, msg: 'ok', data: row}
  })

  app.all('/api/v1/user/status', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let User = ctx.model("user")
   // let Hp = ctx.model("hp")
    let Reward = ctx.model("reward")
    //let Power = ctx.model("power")
    let ZenCd = ctx.model("zenCd")
    let Square = ctx.model("square")
    let Room = ctx.model("room")
    //Available
    //Playing
    let u = await User.getRow({user_id: userId})
/*    let is_follow = await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    let is_join = await checkMember(config.get('telegram').community, userId, 'community')
    if (!u || !u.first_name) {
      await User.updateOrInsertRow({user_id: userId}, {
        first_name: params.first_name,
        last_name: params.last_name,
        username: params.username,
        is_follow: is_follow,
        is_join: is_join,
        avatar: getRandomInt(1, 5) + "",
        channel_id: config.get('telegram').CHANNEL_ID,
        photo_url: params.photo_url,
      })
    } else {
      await User.updateRow({user_id: userId}, {
        is_follow: is_follow, is_join: is_join,
      })
    }*/
  //  u = await User.getRow({user_id: userId})
/*    let hp = await Hp.getRow({user_id: userId})
    if (!hp) {
      await Hp.updateOrInsertRow({user_id: userId}, {
        user_id: userId, value: 3, create_at: moment().valueOf(), update_at: moment().valueOf()
      })
    } else {
      let dur = parseInt((moment().valueOf() - hp.update_at) / (1000 * 60 * 60))
      if (dur > 0) {
        let value = hp.value + dur
        if (value >= 3) {
          await Hp.updateOrInsertRow({user_id: userId}, {
            user_id: userId, value: 3, update_at: moment().valueOf()
          })
        }
        if (value < 3) {
          await Hp.updateOrInsertRow({user_id: userId}, {
            user_id: userId, value: value, update_at: hp.update_at + dur * 1000 * 60 * 60
          })
        }
      }
    }
    hp = await Hp.getRow({user_id: userId})

    let power = await Power.getRow({user_id: userId})
    if (!power) {
      await Power.updateOrInsertRow({user_id: userId}, {
        user_id: userId, value: setting.power.value, create_at: moment().valueOf(), update_at: moment().valueOf()
      })
    } else {
      let dur = parseInt((moment().valueOf() - power.update_at) / (1000 * 60 * 60 * (setting.power.time / setting.power.value)))
      if (dur > 0) {
        let value = power.value + dur
        if (value >= setting.power.value) {
          await Power.updateOrInsertRow({user_id: userId}, {
            user_id: userId, value: setting.power.value, update_at: moment().valueOf()
          })
        }
        if (value < setting.power.value) {
          await Power.updateOrInsertRow({user_id: userId}, {
            user_id: userId,
            value: value,
            update_at: power.update_at + dur * (1000 * 60 * 60 * (setting.power.time / setting.power.value))
          })
        }
      }
    }
    power = await Power.getRow({user_id: userId})*/
    let pts = await Reward.agg([{$match: {user_id: userId}}, {
      $group: {
        _id: null, pts: {$sum: "$pts"}, count: {$sum: 1}
      }
    }, {$project: {pts: 1, count: 1}}, {$sort: {"count": -1}},])
    let usdt = await Reward.agg([{$match: {user_id: userId, is_withdraw: false}}, {
      $group: {
        _id: null, usdt: {$sum: "$usdt"}, count: {$sum: 1}
      }
    }, {$project: {usdt: 1, count: 1}}, {$sort: {"count": -1}},])
    let coins = await Reward.agg([{$match: {user_id: userId}}, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

    let rewards = await Reward.getLimitRows({user_id: userId, type: "exam"}, {end_time: -1}, 1)
    let row = await ZenCd.getLimitRows({user_id: userId}, {_id: -1}, 1)
    let zenCoins = await Reward.agg([{
      $match: {
        user_id: userId, type: "zen_game", create_at: {$gt: row.length > 0 ? row[0].create_at : 0}
      }
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
    let zen_coins = zenCoins.length > 0 && zenCoins[0]['coins'] ? zenCoins[0]['coins'] : 0
    let cd = 0
    let zen_cd = 0
    console.log('zen_coins', zen_coins);
    if (row && row.length > 0) {
      if (moment().valueOf() - row[0].create_at < setDegen.zen.cd) {
        cd = moment().valueOf() - row[0].create_at
        zen_cd = cd > 0 ? setDegen.zen.cd - cd : 0
      } else {
        if (zen_coins >= setDegen.zen.max_coin) {
          await ZenCd.createRow({
            user_id: userId, game_id: row[0].game_id, num: row[0].num + 1, create_at: moment().valueOf()
          })
          zen_coins = 0
          zen_cd = setDegen.zen.cd
        }
      }
    } else {
      if (zen_coins >= setDegen.zen.max_coin) {
        await ZenCd.createRow({user_id: userId, game_id: "3000", num: 1, create_at: moment().valueOf()})
        zen_coins = 0
        zen_cd = setDegen.zen.cd
      }

    }
    let square = await Square.getRow({user_id: userId})
    let room = await Room.getRow({user_id: userId,room_name:'adventure'})

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        user: u,
        register: false,
        is_follow: false,
        is_join: false,
        hp: 0,
        power: 0,
        consecutive_wins_count: rewards.length > 0 ? rewards[0].consecutive_wins_count : 0,
        exam_end_time: rewards.length > 0 ? rewards[0].end_time : 0,
        hp_update_at: 0,
        point: pts.length > 0 && pts[0]['pts'] ? pts[0]['pts'] : 0,
        usdt: usdt.length > 0 && usdt[0]['usdt'] ? usdt[0]['usdt'] : 0,
        coins: coins.length > 0 && coins[0]['coins'] ? coins[0]['coins'] : 0,
        zen_coins: zen_coins,
        zen_cd: zen_cd,
        status:square?(room?'Playing' : 'Available'):"OffLine"

      }
    }
  })

  app.get('/api/v1/user/points', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let pts = await Reward.agg([{$match: {user_id: userId}}, {
      $group: {
        _id: null, pts: {$sum: "$pts"}, count: {$sum: 1}
      }
    }, {$project: {pts: 1, count: 1}}, {$sort: {"count": -1}},])
    let usdt = await Reward.agg([{$match: {user_id: userId, is_withdraw: false}}, {
      $group: {
        _id: null, usdt: {$sum: "$usdt"}, count: {$sum: 1}
      }
    }, {$project: {usdt: 1, count: 1}}, {$sort: {"count": -1}},])

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        point: pts.length > 0 && pts[0]['pts'] ? pts[0]['pts'] : 0,
        usdt: usdt.length > 0 && usdt[0]['usdt'] ? usdt[0]['usdt'] : 0
      }
    }
  })

  app.get('/api/v1/user/getUser', async (ctx, next) => {
    let params = ctx.params
    let name = params.name
    let key = params.key
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    let User = ctx.model("user")
    let rows = await User.getRows({$or: [{first_name: {$regex: name}, username: {$regex: name}}]})
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows
    }
  })


  app.get('/api/v1/user/compensatePoints', async (ctx, next) => {
    let params = ctx.params
    let user_id = params.user_id
    let points = params.points
    let key = params.key
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    if (key != 'ad7ae75545df0df93b7cbedca45d8dc7') {
      return ctx.body = {
        code: '200', success: true, msg: 'key is error', data: null
      }
    }
    if (!user_id || !points) {
      return ctx.body = {
        code: '200', success: true, msg: 'user or points  is error', data: null
      }
    }
    await Reward.createRow({
      "pts": Number(points),
      "type": "compensate",
      "user_id": user_id,
      "create_at": moment().valueOf(),
      "update_at": moment().valueOf()
    })

    let rows = await Reward.getRows({"type": "compensate"})

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows
    }
  })

  app.get('/api/v1/user/getPoweredStatus', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let code = params.code
    let type = params.type
    let User = ctx.model("user")
    let Hp = ctx.model("hp")
    let Help = ctx.model("help")
    let Invitation = ctx.model("invitation")
    let InviteCode = ctx.model("InviteCode")
    let Power = ctx.model("power")

    let invite = await InviteCode.getRow({code: code})
    if (!invite) {
      return ctx.body = {code: '200', success: false, msg: 'code error', data: {}}
    }
    let be_help_user_id = invite.user_id
    let u = await User.getRow({user_id: userId})
    if (!u) {
      return ctx.body = {code: '200', success: false, msg: 'user is null', data: {}}
    }
    let is_follow = await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    let rows = await Help.getRows({
      user_id: userId, create_at: {$gte: moment().subtract(3, "days").valueOf(), $lte: moment().valueOf()}
    })
    let help = await Help.getRow({
      user_id: userId,
      be_help_user_id: be_help_user_id,
      create_at: {$gte: moment().subtract(3, "days").valueOf(), $lte: moment().valueOf()}
    })
    let first_powered_time = rows.length > 0 ? rows[0]['create_at'] : 0
    let wait_powered_time = 0
    let wait_be_powered_time = 0
    if (rows.length >= setting.power.value) {
      wait_powered_time = 1000 * 60 * 60 * 24 * 3 + first_powered_time
    }
    if (help) {
      wait_be_powered_time = 1000 * 60 * 60 * 24 * 3 + help.create_at
    }
    let wait_time = wait_be_powered_time > wait_powered_time ? wait_be_powered_time : wait_powered_time
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        powered_count: rows.length,
        is_powered: help ? true : false,
        is_follow: is_follow ? true : false,
        wait_time: wait_time
      }
    }


  })

  app.get('/api/v1/user/okcan/getPoweredStatus', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let code = params.code
    let activityId = params.activity_id

    let type = params.type //cd  //power //activity
    let User = ctx.model("user")
    let Invitation = ctx.model("invitation")
    let InviteCode = ctx.model("InviteCode")
    let Power = ctx.model("power")
    let Activity = ctx.model("activity")

    let invite = await InviteCode.getRow({code: code})
    if (!invite) {
      return ctx.body = {code: '200', success: false, msg: 'code error', data: {}}
    }
    let power = await Power.getRow({user_id: userId})
    if (!power) {
      await Power.updateOrInsertRow({user_id: userId}, {
        user_id: userId, value: setting.power.value, create_at: moment().valueOf(), update_at: moment().valueOf()
      })
    } else {
      let dur = parseInt((moment().valueOf() - power.update_at) / (1000 * 60 * 60 * (setting.power.time / setting.power.value)))
      if (dur > 0) {
        let value = power.value + dur
        if (value >= setting.power.value) {
          await Power.updateOrInsertRow({user_id: userId}, {
            user_id: userId, value: setting.power.value, update_at: moment().valueOf()
          })
        }
        if (value < setting.power.value) {
          await Power.updateOrInsertRow({user_id: userId}, {
            user_id: userId,
            value: value,
            update_at: power.update_at + dur * (1000 * 60 * 60 * (setting.power.time / setting.power.value))
          })
        }
      }
    }
    power = await Power.getRow({user_id: userId})
    let u = await User.getRow({user_id: userId})
    if (!u) {
      return ctx.body = {code: '200', success: false, msg: 'user is null', data: {}}
    }
    let is_follow = await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    let is_join = await checkMember(config.get('telegram').community, userId, 'community')
    if (type == 'power') {

      let rows = await Invitation.getRows({
        be_invite_user_id: userId, type: "add",
      })
      let is_have_activity = await Activity.getRow({user_id: userId})
      let is_have_invitation = await Invitation.getRow({be_invite_user_id: userId})
      let is_new_user = is_have_activity || is_have_invitation ? false : true
      let help = await Invitation.getRow({
        invite_user_id: invite.user_id,
        be_invite_user_id: userId,
        type: "add",
        create_at: {$gte: moment().subtract(setting.power.time, "hours").valueOf(), $lte: moment().valueOf()}

      })
      let wait_be_powered_time = 0
      if (help) {
        wait_be_powered_time = 1000 * 60 * 60 * setting.power.time + help.create_at
      }
      return ctx.body = {
        code: '200', success: true, msg: 'ok', data: {
          powered_count: rows.length,
          is_powered: help ? true : false,
          is_follow: is_follow,
          is_join: is_join,
          is_new_user: is_new_user,
          recovery_power_time: power.value.length < setting.power.value ? power.update_at + 1000 * 60 * 60 * (setting.power.time / setting.power.value) : moment().valueOf() + 1000 * 60 * 60 * (setting.power.time / setting.power.value),
          power: power.value,
          wait_time: wait_be_powered_time
        }
      }

    } else if (type == 'activity') {

      let rows = await Invitation.getRows({
        be_invite_user_id: userId, type: "activity",
      })
      let is_have_activity = await Activity.getRow({user_id: userId})
      let is_have_invitation = await Invitation.getRow({be_invite_user_id: userId})
      let is_new_user = is_have_activity || is_have_invitation ? false : true
      let help = await Invitation.getRow({
        activity_id: activityId, be_invite_user_id: userId, type: "activity",
      })
      return ctx.body = {
        code: '200', success: true, msg: 'ok', data: {
          powered_count: rows.length,
          is_powered: help ? true : false,
          is_follow: is_follow,
          is_join: is_join,
          is_new_user: is_new_user,
          recovery_power_time: power.value.length < setting.power.value ? power.update_at + 1000 * 60 * 60 * (setting.power.time / setting.power.value) : moment().valueOf() + 1000 * 60 * 60 * (setting.power.time / setting.power.value),
          power: power.value,
          wait_time: 0
        }
      }


    } else if (type == 'cd') {
      let rows = await Invitation.getRows({
        be_invite_user_id: userId, type: "cd",
      })
      let is_have_activity = await Activity.getRow({user_id: userId})
      let is_have_invitation = await Invitation.getRow({be_invite_user_id: userId})
      let is_new_user = is_have_activity || is_have_invitation ? false : true
      let activities = await Activity.getLimitRows({user_id: userId}, {num: -1}, 1)
      let help = null
      if (activities.length > 0) {
        help = await Invitation.getRow({
          type: "cd", num: activities[0]['num'] + 1, be_invite_user_id: userId, invite_user_id: invite.user_id
        })
      }
      return ctx.body = {
        code: '200', success: true, msg: 'ok', data: {
          powered_count: rows.length,
          is_powered: help ? true : false,
          is_follow: is_follow,
          is_join: is_join,
          is_new_user: is_new_user,
          recovery_power_time: power.value.length < setting.power.value ? power.update_at + 1000 * 60 * 60 * (setting.power.time / setting.power.value) : moment().valueOf() + 1000 * 60 * 60 * (setting.power.time / setting.power.value),
          power: power.value,
          wait_time: 0
        }
      }
    } else {
      return ctx.body = {
        code: '200', success: true, msg: 'ok', data: {
          powered_count: 0,
          is_powered: false,
          is_follow: false,
          is_join: false,
          is_new_user: false,
          recovery_power_time: 0,
          power: 0,
          wait_time: 0
        }
      }
    }


  })

  app.post('/api/v1/user/help/addHp', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let code = params.code
    let User = ctx.model("user")
    let Hp = ctx.model("hp")
    let Help = ctx.model("help")
    let InviteCode = ctx.model("InviteCode")
    let invite = await InviteCode.getRow({code: code})
    if (!invite) {
      return ctx.body = {code: '200', success: false, msg: 'code error', data: {}}
    }
    let be_help_user_id = invite.user_id

    if (be_help_user_id == userId) {

      return ctx.body = {code: '200', success: false, msg: 'Cannot be the same person', data: {}}
    }

    let u = await User.getRow({user_id: be_help_user_id})
    if (!u) {
      return ctx.body = {code: '200', success: false, msg: 'user is null', data: {}}
    }
    let is_follow = await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    if (is_follow) {
      let count = await Help.getRowsCount({
        user_id: userId, create_at: {$gte: moment().subtract(3, "days").valueOf(), $lte: moment().valueOf()}
      })
      if (count >= 5) {
        return ctx.body = {
          code: '200', success: false, msg: 'Can only help 5 different people within 72 hours', data: {}
        }
      }
      let is_help = await Help.getRow({
        user_id: userId,
        be_help_user_id: be_help_user_id,
        create_at: {$gte: moment().subtract(3, "days").valueOf(), $lte: moment().valueOf()}
      })
      if (is_help) {
        return ctx.body = {
          code: '200', success: false, msg: 'Can only help the same person once within 72 hours', data: {}
        }
      }
      let hp = await Hp.getRow({user_id: be_help_user_id})
      await Hp.updateOrInsertRow({user_id: be_help_user_id}, {
        user_id: be_help_user_id,
        value: (hp.value + 1 >= 3) ? 3 : (hp.value + 1),
        create_at: moment().valueOf(),
        update_at: moment().valueOf()
      })
      await Help.createRow({
        user_id: userId, be_help_user_id: be_help_user_id, create_at: moment().valueOf(), update_at: moment().valueOf()
      })
    } else {
      return ctx.body = {code: '200', success: false, msg: 'not follow channel', data: {}}
    }
    let hp = await Hp.getRow({user_id: be_help_user_id})
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: hp
    }
  })

  app.get('/api/v1/user/help/helpList', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Help = ctx.model("help")
    let User = ctx.model("user")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let helps = await Help.getPagedRows({be_help_user_id: userId}, page * limit, limit, {create_at: -1})
    for (let i = 0; i < helps.length; i++) {
      let u = await User.getRow({user_id: helps[i]['be_help_user_id']})
      helps[i]['user'] = u

    }
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: helps
    }
  })
  //ID、name、username、language_code
  //user_id
  app.post('/api/v1/user/register', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let User = ctx.model("user")
    let u = await User.getRow({user_id: userId})
    let is_follow = await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    let is_join = await checkMember(config.get('telegram').community, userId, 'community')
    if (!u ) {
      await User.updateOrInsertRow({user_id: userId}, {
        first_name: params.first_name,
        last_name: params.last_name,
        username: params.username,
        is_follow: is_follow,
        is_join: is_join,
        avatar: getRandomInt(1, 5) + "",
        channel_id: config.get('telegram').CHANNEL_ID,
        photo_url: params.photo_url,
      })
    } else {
      await User.updateRow({user_id: userId}, {
        is_follow: is_follow, is_join: is_join,
      })
    }
    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {}
    }
  })

  app.post('/api/v1/user/registerOrLogin', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let message = params.message
    let signature = params.signature
    let address = params.address
    let User = ctx.model("user")
    if (!userId) {
      return  ctx.body = {
        code: '200', success: false, msg: ' user_id empty', data: null
      }
    }
    let u = await User.getRow({user_id: userId})
    let is_follow =false //await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    let is_join = false //await checkMember(config.get('telegram').community, userId, 'community')
    if (!u ) {
      console.log(message);
      /*const signedResult = await signPersonalMessage.mutateAsync({
        message: new TextEncoder().encode(message),
      });*/
      console.log('Signature from wallet:', signature);
      try {
        // Revert to using verifyPersonalMessageSignature with the original message bytes
        const isValid = await verifyPersonalMessageSignature(new TextEncoder().encode(message), signature, {
          address: address
        });
        if (!isValid) {
          return  ctx.body = {
            code: '200', success: false, msg: 'signature verify fail ', data: {}
          }
        }
        console.log(isValid ? 'Signature verification (using verifyPersonalMessageSignature): 签名有效！' : 'Signature verification (using verifyPersonalMessageSignature): 签名无效！');
      }catch (e) {
        console.error('Error during verifyPersonalMessageSignature:', e);
        return  ctx.body = {
          code: '200', success: false, msg: 'signature verify fail ', data: {}
        }
      }
      await User.updateOrInsertRow({user_id: address}, {
        user_id: address,
        first_name: params.first_name,
        last_name: params.last_name,
        username: params.username,
        is_follow: is_follow,
        is_join: is_join,
        avatar: getRandomInt(1, 5) + "",
        channel_id: config.get('telegram').CHANNEL_ID,
        photo_url: params.photo_url,
      })
    }

    const token = jwt.sign(
        {
          address,
          timestamp: Date.now()
        },
        JWT_SECRET,
        { expiresIn: '365d' }
    );


    return  ctx.body = {
      code: '200', success: true, msg: 'ok', data: {token:token}
    }
  })



}
