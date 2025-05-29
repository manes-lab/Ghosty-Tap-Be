var space = require('../remote/base');
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
// 定义 ping 接口
handler.ping = function (msg, session, next) {
  // 直接返回客户端发送的时间戳
  next(null, { serverTime: Date.now(), clientTime: msg.clientTime });
};

handler.enterSpace = async function (msg, session, next) {
  let self = this;
  let tradingPair = msg.tradingPair
  let type = msg.type;
  if (!tradingPair || !type) {
    next(null, {
      code: 500, error: true
    });
    return;
  }

  if (!session || !session.uid) {
    return;
  }
  if (session.get('type') != "square") {
    self.app.rpc.space.base.kick(session, session.uid, session.get('sid'), session.get('type'), session.id, function (data) {
      console.log(data);
    });
  }
  session.set('type', type);
  session.pushAll()

  console.log('room session.id: ', session.id);
  self.app.rpc.space.base.add(session, session.uid, session.get('sid'), type, function (user) {

    console.log(user);
    next(null, {
      code: '200', success: true, msg: 'ok', data: user
    });
  });
};

handler.leaveSpace = async function (msg, session, next) {
  let self = this
  if (!session || !session.uid) {
    return;
  }
  if (session.get('type') != "square") {
    self.app.rpc.space.base.kick(session, session.uid, session.get('sid'), session.get('type'), session.id, function (data) {
      console.log(data);
    });
  }
  
  session.set('type', "square");
  session.pushAll()
  next(null, {
    code: '200', success: true, msg: 'ok', data: {}
  });

}


handler.submitZenGameData = async function (params, session, next) {
  let self = this;
  console.log('params :', params);
  let gameId = params.game_id
  // let userId = params.userId;
  if (!session || !session.uid) {
    next(null, {
      code: 500, error: true
    });
  }
  console.log('session.uid :', session.uid);

  let userId = session.uid;
  let User = this.db.model("user")
  let Reward = this.db.model("reward")
  let Game = this.db.model("game")
  let ZenCd = this.db.model("zencd")
  let Room = this.db.model("room")
  let coin = setting.zen.coin
  let u = await User.getRow({user_id: userId})
  let game = await Game.getRow({_id: mongoose.Types.ObjectId(gameId)})
  let row = await ZenCd.getLimitRows({user_id: userId}, {_id: -1}, 1)
  let q = {user_id: userId}
  let num = 0
  if (row.length > 0) {
    if (moment().valueOf() - row[0].create_at < setting.zen.cd) {
      next(null, {
        code: '202', success: false, msg: 'Time less than 10 minute', data: {}
      });
      return
    }
    q['create_at'] = {$gte: row[0].create_at}
    num = row[0].num + 1
  }
  let qc = {
    user_id: userId,
    game_id: game['_id'],
    type: 'zen_game',
    trading_pair: game.trading_pair,
    end_time: moment().valueOf(),
    consecutive_wins_count: 0,
    coins: coin,
  }
  console.log('qc ', qc);

  await Reward.createRow({
    user_id: userId,
    game_id: game['_id'],
    type: 'zen_game',
    trading_pair: game.trading_pair,
    end_time: moment().valueOf(),
    consecutive_wins_count: 0,
    coins: coin,
  })
  let room = await Room.getRow({user_id: userId, room_name: 'zen'})
  if (room) {
    await Room.updateRow({
      user_id: userId, room_name: 'zen',
    }, {coins: coin + room.coins,})
  }

  let coins = await Reward.agg([{$match: q}, {
    $group: {
      _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
    }
  }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

  let maxCoins = coins.length > 0 && coins[0]['coins'] ? coins[0]['coins'] : 0
  if (maxCoins >= setting.zen.max_coin) {
    await ZenCd.createRow({user_id: userId, game_id: gameId, num: num, create_at: moment().valueOf()})
  }

  await Game.updateRow({_id: mongoose.Types.ObjectId(gameId)}, {
    update_at: moment().valueOf()
  })

  coins = await Reward.agg([{$match: {user_id: userId}}, {
    $group: {
      _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
    }
  }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

  next(null, {
    code: '200', success: true, msg: 'ok', data: {
      user: u,
      register: u && u.register ? true : false,
      coins: coins.length > 0 && coins[0]['coins'] ? coins[0]['coins'] : 0
    }
  });
  return

};


handler.submitAdventureGameData = async function (params, session, next) {
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
  let Reward = this.db.model("reward")
  let Game = this.db.model("game")
  let GameData = this.db.model("gamedata")
  let Room = this.db.model("room")
  let gameId = params.game_id
  let u = await User.getRow({user_id: userId})
  let game = await Game.getRow({_id: mongoose.Types.ObjectId(gameId)})
  if (!game || game.is_end) {
    next(null, {
      code: '200', success: false, msg: 'game over', data: {}
    })
    return
  }
  let gameDataRows = await GameData.getLimitRows({game_id: game['_id']}, {_id: -1}, 1)
  let num = 0
  if (gameDataRows.length > 0) {
    num = gameDataRows[0].num + 1
  }
  let g = await GameData.getLimitRows({
    user_id: userId, game_id: game['_id'], $or: [{is_success: 0}, {is_success: 1}, {is_success: 3}]
  }, {_id: -1}, 1)
  let trade_no = 'H' + moment().valueOf()
  if (is_success == 1 && g && g.length > 0 && (g[0].is_success == 1 || g[0].is_success == 2)) {
    trade_no = g[0].trade_no
  }

  await GameData.createRow({
    user_id: userId,
    game_id: game['_id'],
    result: result,
    trading_pair: game.trading_pair,
    num: num,
    trade_no: trade_no,
    is_success: is_success,
    end_time: moment().valueOf()
  })

  let consecutive_wins = 0
  let consecutive_wins_point = 0
  /*  for (let i = num; i > 0; i--) {
      let check = await GameData.getRow({game_id: game['_id'], num: i})
      if (check.is_success == 1) {
        consecutive_wins=consecutive_wins+1
      } else if (check.is_success == 2) {

      } else {
        break
      }
    }*/
  let count = await GameData.getRowsCount({game_id: game['_id']})
  for (let i = 0; i < count; i++) {
    let check = await GameData.getRow({game_id: game['_id'], num: count - 1 - i})
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

  if (is_success == 1) {
    let timeCoins = 0
    if (time == 1) {
      timeCoins = 100
    } else if (time == 2) {

      timeCoins = 50
    } else {
      timeCoins = 0
    }
    await Reward.createRow({
      user_id: userId,
      game_id: game['_id'],
      type: 'adventure_game',
      trading_pair: game.trading_pair,
      trade_no: trade_no,
      time: time,
      end_time: moment().valueOf(),
      consecutive_wins_count: consecutive_wins,
      coins: setting.adventure.coin + consecutive_wins_point + timeCoins * consecutive_wins,
    })

    let room = await Room.getRow({user_id: userId, room_name: 'adventure'})
    if (room) {
      await Room.updateRow({
        user_id: userId, room_name: 'adventure',
      }, {coins: setting.adventure.coin + consecutive_wins_point + timeCoins * consecutive_wins + room.coins,})
    }


  }
  if (is_success == 0) {

    await Reward.createRow({
      user_id: userId,
      game_id: game['_id'],
      type: 'adventure_game',
      trading_pair: game.trading_pair,
      trade_no: trade_no,
      time: time,
      end_time: moment().valueOf(),
      consecutive_wins_count: 0,
      coins: -setting.adventure.coin,
    })
    let room = await Room.getRow({user_id: userId, room_name: 'adventure'})
    if (room) {
      await Room.updateRow({
        user_id: userId, room_name: 'adventure',
      }, {coins: -setting.adventure.coin + room.coins,})
    }

  }


  let coins = await Reward.agg([{$match: {user_id: userId}}, {
    $group: {
      _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
    }
  }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

  next(null, {
    code: '200', success: true, msg: 'ok', data: {
      user: u,
      register: u && u.register ? true : false,
      coins: coins.length > 0 && coins[0]['coins'] ? coins[0]['coins'] : 0
    }
  });
  return

};