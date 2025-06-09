const setting = require("../../../../../api/v1/setting/degen.json");
const mongoose = require("mongoose");
const moment = require("moment");

module.exports = function (app) {
  return new Handler(app);
};

var Handler = function (app) {
  this.app = app;
  this.channelService = app.get('channelService');
  this.db = app.components['db']
};

var handler = Handler.prototype;

handler.submitBattleAdventureGameData = async function (params, session, next) {
  let self = this;
  console.log('params :', params);
  if (!session || !session.uid) {
    next(null, {
      code: 500, error: true
    });
  }
  console.log('session.uid :', session.uid);
  let userId = session.uid;
  let is_success = params.is_success
  let result = params.result
  let time = params.time
  let User = this.db.model("user")
  let GameDataBattle = this.db.model("gamedatabattle")
  let Battle = this.db.model("battle")
  let Reward = this.db.model("reward")

  let battleId = params.battle_id
  let u = await User.getRow({user_id: userId})
  let battle = await Battle.getRow({_id: mongoose.Types.ObjectId(battleId)})
  if (!battle || (battle.invite_user_status == 2 && battle.be_invite_user_status == 2)) {
    next(null, {
      code: '200', success: false, msg: 'game over', data: {}
    })
    return
  }

  let count = await GameDataBattle.getRowsCount({user_id: userId, battle_id: battle['_id']})
  if (count >= 10) {
    next(null, {
      code: '200', success: false, msg: 'game over', data: {}
    })
    return
  }

  let isInvite = userId == battle.invite_user_id

  let consecutive_wins = 0
  let consecutive_wins_point = 0




  for (let i = 0; i < count; i++) {
    let check = await GameDataBattle.getRow({user_id: userId, battle_id: battle['_id'], num: count - 1 - i})
    if (!check) {
      continue
    }
    if (check.is_success == 1) {
      consecutive_wins = consecutive_wins + 1
    } else if (check.is_success == 2) {

    } else {
      break
    }
  }

  if (consecutive_wins == 2) {
    consecutive_wins_point = 50
  } else if (consecutive_wins == 3) {
    consecutive_wins_point = 100
  } else if (consecutive_wins == 4) {
    consecutive_wins_point = 200
  } else if (consecutive_wins == 5) {
    consecutive_wins_point = 300
  } else if (consecutive_wins >= 6 && consecutive_wins <= 9) {
    consecutive_wins_point = 400
  } else if (consecutive_wins == 10) {
    consecutive_wins_point = 800
  } else if (consecutive_wins >= 11 && consecutive_wins <= 19) {
    consecutive_wins_point = 600
  } else if (consecutive_wins == 20) {
    consecutive_wins_point = 1800
  } else if (consecutive_wins >= 11 && consecutive_wins <= 19) {
    consecutive_wins_point = 600
  } else if (consecutive_wins == 20) {
    consecutive_wins_point = 1800
  } else if (consecutive_wins >= 21 && consecutive_wins <= 29) {
    consecutive_wins_point = 700
  } else if (consecutive_wins == 30) {
    consecutive_wins_point = 2800
  } else if (consecutive_wins >= 31 && consecutive_wins <= 39) {
    consecutive_wins_point = 800
  } else if (consecutive_wins == 40) {
    consecutive_wins_point = 3800
  } else if (consecutive_wins >= 41 && consecutive_wins <= 49) {
    consecutive_wins_point = 900
  } else if (consecutive_wins == 50) {
    consecutive_wins_point = 4800
  } else if (consecutive_wins >= 51 && consecutive_wins <= 59) {
    consecutive_wins_point = 900
  } else if (consecutive_wins == 60) {
    consecutive_wins_point = 5800
  } else if (consecutive_wins >= 61 && consecutive_wins <= 69) {
    consecutive_wins_point = 1100
  } else if (consecutive_wins == 70) {
    consecutive_wins_point = 5800
  } else if (consecutive_wins == 80) {
    consecutive_wins_point = 5800
  } else if (consecutive_wins > 70 && consecutive_wins != 80) {
    consecutive_wins_point = 1100
  }

  let pushUserId = isInvite ? battle.be_invite_user_id : battle.invite_user_id



  let timeCoins = 0
  if (time == 1) {
    timeCoins = 100
  } else if (time == 2) {
    timeCoins = 50
  } else {
    timeCoins = 0
  }
  let coins = 0
  let rewardCoins = 0
  if (is_success == 1) {
    rewardCoins = setting.adventure.coin + consecutive_wins_point + timeCoins * consecutive_wins
  } else if(is_success == 0) {
    rewardCoins = -setting.adventure.coin
  }else {
    rewardCoins = 0
  }
  if (isInvite) {
    coins = Math.max(battle.invite_user_coins + rewardCoins, 0)
    await Battle.updateRow({
      _id: battle['_id'],
    }, {
      invite_user_coins: coins
    })
  } else {
    coins = Math.max(battle.be_invite_user_coins + rewardCoins, 0)
    await Battle.updateRow({
      _id: battle['_id'],
    }, {
      be_invite_user_coins: coins,
    })
  }

  let param = {
    battle_id: battle['_id'],
    userId,
    step: count + 1,
    coins,
    is_success,
    result: result
  }


//mark


  let gameDataRows = await GameDataBattle.getLimitRows({user_id: userId, battle_id: battle['_id']}, {_id: -1}, 1)
  let num = 0
  if (gameDataRows.length > 0) {
    num = gameDataRows[0].num + 1
  }
  let g = await GameDataBattle.getLimitRows({
    user_id: userId, battle_id: battle['_id'], $or: [{is_success: 0}, {is_success: 1}, {is_success: 3}]
  }, {_id: -1}, 1)
  let trade_no = 'H' + moment().valueOf()
  if (is_success == 1 && g && g.length > 0 && (g[0].is_success == 1 || g[0].is_success == 2)) {
    trade_no = g[0].trade_no
  }

  await GameDataBattle.createRow({
    user_id: userId,
    battle_id: battle['_id'],
    result: result,
    trading_pair: battle.trading_pair,
    num: num,
    trade_no: trade_no,
    is_success: is_success,
    end_time: moment().valueOf()
  })
  count += 1

  if (count >= 10) {
    if (battle.invite_user_id == userId) {
      await Battle.updateRow({_id: battle['_id']}, {invite_user_status: 2})
    } else {
      await Battle.updateRow({_id: battle['_id']}, {be_invite_user_status: 2})
    }
  }



  battle = await Battle.getRow({_id: battle['_id']})
  if (battle.invite_user_status == 2 && battle.be_invite_user_status == 2 && battle.status=='pending') {
    if (battle.invite_user_coins > battle.be_invite_user_coins) {
      await Battle.updateRow({_id: battle['_id']}, {status: 'success'})
      await Reward.createRow({
        user_id: battle.invite_user_id,
        battle_id: battle['_id'],
        type: 'pk',
        trading_pair: battle.trading_pair,
        end_time: moment().valueOf(),
        from: "battle",
        coins: battle.coins,
      })
      await Reward.createRow({
        user_id: battle.be_invite_user_id,
        battle_id: battle['_id'],
        type: 'pk',
        trading_pair: battle.trading_pair,
        end_time: moment().valueOf(),
        from: "battle",
        coins: -battle.coins,
      })


    } else if (battle.invite_user_coins < battle.be_invite_user_coins) {
      await Battle.updateRow({_id: battle['_id']}, {status: 'fail'})
      await Reward.createRow({
        user_id: battle.invite_user_id,
        battle_id: battle['_id'],
        type: 'pk',
        trading_pair: battle.trading_pair,
        end_time: moment().valueOf(),
        from: "battle",
        coins: -battle.coins,
      })
      await Reward.createRow({
        user_id: battle.be_invite_user_id,
        battle_id: battle['_id'],
        type: 'pk',
        trading_pair: battle.trading_pair,
        end_time: moment().valueOf(),
        from: "battle",
        coins: battle.coins,
      })
    } else {
      await Battle.updateRow({_id: battle['_id']}, {status: 'draw'})
    }



  }

  if (count >= 10) {
    self.app.rpc.space.base.pushMessage(null, battle.invite_user_id, 'battleOver', {battle_id: battle['_id'], reason: "finish"}, () => {
      console.log("push", battle.invite_user_id, 'battleOver', {battle_id: battle['_id']})
    })
    self.app.rpc.space.base.pushMessage(null, battle.be_invite_user_id, 'battleOver', {battle_id: battle['_id'], reason: "finish"}, () => {
      console.log("push", battle.be_invite_user_id, 'battleOver', {battle_id: battle['_id']})
    })
  }else {
    self.app.rpc.space.base.pushMessage(null, pushUserId, 'battleStep', param, (data) => {
      console.log("send message connect fail ",data);

        if (data&&data.code===500) {
            self.app.rpc.battle.base.leave(null, pushUserId, battle['_id'], () => {
              console.log("push", userId, 'battleOver', {battle_id: battle['_id'], reason: "leave"})
            })
          //  return
          }
      console.log("push", pushUserId, 'battleStep', param)
    })
  }



  next(null, {
    code: '200', success: true, msg: 'ok', data: param
  });

};

handler.sendInvitation = async function (params, session, next) {
  let self = this;
  console.log('params :', params);
  if (!session || !session.uid) {
    next(null, {
      code: 500, error: true
    });
  }
  console.log('session.uid :', session.uid);

  let userId = session.uid;
  let beInvitedUserId = params.be_invite_user_id
  let tradingPair = params.trading_pair
  let coins = params.coins
  let Mail = this.db.model("mail")
  let User = this.db.model("user")
  let Square = this.db.model("square")
  let Room = this.db.model("room")
  let Battle = this.db.model("battle")
  let InvitationBattle = this.db.model("invitationbattle")
  let System = this.db.model("system")
  let trade_no = 'Tx-' + userId + moment().valueOf()
  //Available
  //Playing
  if (!userId||!beInvitedUserId){
    next(null, {
      code: '200', success: false, msg: 'user error', data: {}
    });
    return
  }
  if (coins<=0){
    next(null, {
      code: '200', success: false, msg: 'coins must > 0', data: null
    });
    return
  }
  let invitation = await InvitationBattle.createRow({
    trade_no: trade_no,
    invite_user_id: userId,
    be_invite_user_id: beInvitedUserId,
    trading_pair: tradingPair,
    coins: coins,
    status: 0
  })
  await Mail.createRow({
    trade_no: trade_no, send_user_id: userId, recipient_user_id: beInvitedUserId, status: 'View'
  })

  let r = await Room.getRow({user_id: userId, room_name: "adventure"})
  let s = await System.getRow({user_id: userId})
  if (s && s.adventure_refuse && r || s && s.pk_refuse) {
    console.log('refuse notice');
  } else {
    let param = {
      invite_id: invitation._id,
      invite_user_id: userId
    }
  let sid =  self.app.get('serverId')
    console.log('sid :' ,sid);
    self.app.rpc.space.base.pushMessage(null, beInvitedUserId, 'inviteBattle', param, () => {
      console.log("push", beInvitedUserId, 'inviteBattle', param)
    })
  }

  next(null, {
    code: '200', success: true, msg: 'ok', data: {invite_id: invitation._id}
  });
  return

};

handler.dealInvitation = async function (params, session, next) {
  let self = this
  if (!session || !session.uid) {
    next(null, {
      code: 500, error: true
    });
  }
  let userId = String(session.uid);
  let invitationId = params.invite_id
  let type = params.type //Decline  Accept
  let Mail = this.db.model("mail")
  let User = this.db.model("user")
  let Battle = this.db.model("battle")
  let BattleBars = this.db.model("battlebars")
  let Reward = this.db.model("reward")
  let InvitationBattle = this.db.model("invitationbattle")
  let invitation = await InvitationBattle.getRow({
    _id: mongoose.Types.ObjectId(invitationId)
  })

  if (!invitation) {
    next(null, {
      code: '201', success: false, msg: 'Invitation information does not exist', data: {}
    })
  }

  await InvitationBattle.updateRow({
    _id: mongoose.Types.ObjectId(invitationId),
  }, {
    status: type == "Accept" ? 1 : 2
  })
  await Mail.updateRow({trade_no: invitation.trade_no}, {status: type})

  if (type == "Accept") {

    let invite_coins = await Reward.agg([{$match: {user_id: invitation.invite_user_id}}, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

    let t_invite_coins = invite_coins && invite_coins.length > 0 ? invite_coins[0].coins : 0
    let be_invite_coins = await Reward.agg([{$match: {user_id: userId}}, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
    let t_be_invite_coins = be_invite_coins && be_invite_coins.length > 0 ? be_invite_coins[0].coins : 0
    console.log(userId, t_invite_coins, invite_coins.length, t_be_invite_coins, be_invite_coins.length)

    let is_sate = (t_invite_coins >= invitation.coins && t_be_invite_coins >= invitation.coins) ? true : false
    if (!is_sate && !invitation.invite_user_id.startsWith("robot")){
      next(null, {
        code: '200', success: false, msg: 'Insufficient  coins', data: null
      });
      return
    }
    let bars = await new Promise((resolve, reject) => {
      self.app.rpc.singleton.base.get(null, 'priceService', 'getRandom', {instId: invitation.trading_pair, count: 10, limit: 5}, (data) => {
        resolve(data)
      })
    })
    
    await Battle.createRow({
      invite_user_id: invitation.invite_user_id,
      be_invite_user_id: userId,
      trading_pair: invitation.trading_pair,
      coins: invitation.coins,
      invite_id: invitationId,
      status: 'pending',
    })
    let battle = await Battle.getRow({ invite_id: invitationId})
    if (!battle){
      next(null, {
        code: '200', success: false, msg: 'Failed to accept invitation', data: null
      });
      return
    }
    await BattleBars.createRow({
      battle_id: battle['_id'],
      bars
    })
    self.app.rpc.space.base.pushMessage(null, invitation.invite_user_id, 'acceptBattle', battle, () => {
      console.log("push", invitation.invite_user_id, 'acceptBattle', battle)
    })

    next(null, {
      code: '200', success: true, msg: 'ok', data: battle
    });
    return
  }

  let inviteUser = await User.getRow({user_id: userId})

  self.app.rpc.space.base.pushMessage(null, invitation.invite_user_id, 'declineBattle', {user: inviteUser}, () => {
    console.log("push", userId, 'declineBattle', {})
  })
  next(null, {
    code: '200', success: true, msg: 'ok', data: {}
  });
}

handler.leaveBattle = async function (params, session, next) {
  let self = this
  if (!session || !session.uid) {
    next(null, {
      code: 500, error: true
    });
  }
  let userId = session.uid;
  let battleId = params.battle_id
  let Room = this.db.model("room")
  let User = this.db.model("user")
  let Battle = this.db.model("battle")
  let Reward = this.db.model("reward")
  let battle = await Battle.getRow({_id: mongoose.Types.ObjectId(battleId)})
  if (!battle) {
    next(null, {
      code: '200', success: true, msg: 'battle not found', data: {}
    });
    return
  }

  self.app.rpc.battle.base.leave(null, userId, battle['_id'], () => {
    console.log("push", userId, 'battleOver', {battle_id: battle['_id'], reason: "leave"})
  })

  next(null, {
    code: '200', success: true, msg: 'ok', data: battle
  });
}

handler.ready = async function (params, session, next) {
  let self = this
  if (!session || !session.uid) {
    next(null, {
      code: 500, error: true
    });
  }

  let userId = session.uid;
  let battleId = params.battle_id
  let Battle = this.db.model("battle")
  let battle = await Battle.getRow({_id: mongoose.Types.ObjectId(battleId)})

  let isInvite = userId == battle.invite_user_id

  if (isInvite) {
    await Battle.updateRow({_id: battle['_id']}, {invite_user_status: 1})
  } else {
    await Battle.updateRow({_id: battle['_id']}, {be_invite_user_status: 1})
  }

  let pushUserId = isInvite ? battle.be_invite_user_id : battle.invite_user_id
  self.app.rpc.space.base.pushMessage(null, pushUserId, 'battleReady', {battle_id: battle['_id']}, () => {
    next(null, {
      code: '200', success: true, msg: 'ok', data: {battle_id: battle['_id']}
    });
  })

}
