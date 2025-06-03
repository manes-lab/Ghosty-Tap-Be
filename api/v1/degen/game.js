const {checkMember} = require("../../../utils/telegram/api");
const config = require("config");
const moment = require("moment");
const mongoose = require("mongoose");
const setting = require("../setting/degen.json");
const {getRandomInt} = require("../../../utils/utils")
const setDegen = require("../setting/degen.json");
module.exports = function (app) {

  app.post('/api/v1/game/adventure/createGame', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let type = params.type  //adventure ,zen
    let tradingPair = params.trading_pair
    let User = ctx.model("user")
    let Game = ctx.model("game")
    let Reward = ctx.model("reward")

    let u = await User.getRow({user_id: userId})
    let is_follow = await checkMember(config.get('telegram').CHANNEL_ID, userId, 'follow')
    let is_join = await checkMember(config.get('telegram').community, userId, 'community')
    if (!u || !u.first_name) {
      await User.updateOrInsertRow({user_id: userId}, {
        first_name: params.first_name,
        last_name: params.last_name,
        username: params.username,
        is_follow: is_follow,
        avatar: getRandomInt(1, 5) + "",
        is_join: is_join,
        channel_id: config.get('telegram').CHANNEL_ID,
        photo_url: params.photo_url,
      })
      u = await User.getRow({user_id: userId})
    } else {
      await User.updateRow({user_id: userId}, {
        is_follow: is_follow, is_join: is_join,
      })
    }
    if (!tradingPair) {
      return ctx.body = {code: '200', success: false, msg: 'user is null', data: {}}
    }

    await Game.updateRows({user_id: userId}, {is_end: true})
    if (type == 'adventure') {
      let num = 1
      let activities = await Game.getLimitRows({user_id: userId, type: 'adventure'}, {num: -1}, 1)
      if (activities.length > 0) {
        num = activities[0]['num'] + 1
      }
      await Game.createRow({
        user_id: userId,
        num: num,
        type: type,
        trading_pair: tradingPair,
        create_at: moment().valueOf(),
        update_at: moment().valueOf()
      })

      let a = await Game.getRow({
        user_id: userId, type: 'adventure', num: num,
      })

      if (!a) {
        return ctx.body = {code: '200', success: false, msg: 'game init fail', data: {}}
      } else {
        ctx.body = {code: '200', success: true, msg: 'ok', data: a}
      }
    } else {
      let num = 1
      let activities = await Game.getLimitRows({user_id: userId, type: 'zen'}, {num: -1}, 1)
      if (activities.length > 0) {
        num = activities[0]['num'] + 1
      }
      await Game.createRow({
        user_id: userId,
        num: num,
        type: type,
        trading_pair: tradingPair,
        create_at: moment().valueOf(),
        update_at: moment().valueOf()
      })
      let a = await Game.getRow({
        user_id: userId, type: 'zen', num: num,
      })
      return ctx.body = {code: '200', success: true, msg: 'ok', data: a}
    }

  })
  app.post('/api/v1/game/adventure/submitGameData', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let is_success = params.is_success
    let result = params.result
    let time = params.time
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    let Game = ctx.model("game")
    let GameData = ctx.model("gameData")
    let Room = ctx.model("room")
    let gameId = params.game_id
    let u = await User.getRow({user_id: userId})
    /*    await Game.updateRow({_id: mongoose.Types.ObjectId(gameId)}, {
          result: result, is_success: is_success, is_end: true, end_time: moment().valueOf()
        })*/
    let game = await Game.getRow({_id: mongoose.Types.ObjectId(gameId)})
    if (game.is_end) {
      return ctx.body = {
        code: '200', success: false, msg: 'game over', data: {}
      }
    }
    let gameDataRows = await GameData.getLimitRows({game_id: game['_id'].toString()}, {_id: -1}, 1)
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
    /*        for (let i = num; i > 0; i--) {
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
        end_time: moment().valueOf(),
        consecutive_wins_count: consecutive_wins,
        coins: setting.adventure.coin + consecutive_wins_point + timeCoins,
      })

      let room = await Room.getRow({user_id: userId, room_name: 'adventure'})
      if (room) {
        await Room.updateRow({
          user_id: userId, room_name: 'adventure',
        }, {coins: setting.adventure.coin + consecutive_wins_point + timeCoins + room.coins,})
      }


    }
    if (is_success == 0) {

      await Reward.createRow({
        user_id: userId,
        game_id: game['_id'],
        type: 'adventure_game',
        trading_pair: game.trading_pair,
        trade_no: trade_no,
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

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        user: u,
        register: u.register ? true : false,
        coins: coins.length > 0 && coins[0]['coins'] ? coins[0]['coins'] : 0
      }
    }
  })
  app.post('/api/v1/game/zen/asyncSubmitGameData', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let coin = params.coin
    let gameId = params.game_id
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    let Game = ctx.model("game")
    let ZenCd = ctx.model("zenCd")
    let u = await User.getRow({user_id: userId})
    let game = await Game.getRow({_id: mongoose.Types.ObjectId(gameId),type:"zen"})
    if (!game){
      return  ctx.body = {
        code: '200', success: false, msg: 'game not found', data: {}
      }
    }

    let totalCoins = await Reward.agg([{$match: {user_id: userId}}, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
    let total_coins = totalCoins.length > 0 && totalCoins[0]['coins'] ? totalCoins[0]['coins'] : 0
    if (coin>=total_coins){


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
        if (zen_coins >= setDegen.zen.max_coin) {
          return   ctx.body = {
            code: '200', success: false, msg: ' zen cd', data: { } }
        }


      let last_coin = total_coins-coin
      if (last_coin<=setting.zen.max_coin){
        await Reward.createRow({
          user_id: userId,
          game_id: game['_id'],
          type: 'zen_game',
          trading_pair: game.trading_pair,
          end_time: moment().valueOf(),
          consecutive_wins_count: 0,
          coins: last_coin,
        })

      }

      return   ctx.body = {
        code: '200', success: true, msg: 'ok', data: { } }
    }else {
      return  ctx.body = {
        code: '200', success: true, msg: 'ok', data: {}
      }
    }



  })

  app.get('/api/v1/game/adventure/gameHistory', async (ctx, next) => {
    let params = ctx.params
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let userId = params.user_id
    let tradingPair = params.trading_pair
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    let Game = ctx.model("game")
    let q = {
      user_id: userId, type: 'adventure_game', coins: {$ne: 0}
    }
    if (tradingPair) {
      q['trading_pair'] = tradingPair
    }
    let games = await Reward.agg([{
      $match: q
    }, {
      $group: {
        _id: "$trade_no", coins: {$sum: "$coins"}, lastDocument: {
          $last: "$$ROOT"
        }, count: {$sum: 1}
      }
    }, {
      $project: {
        coins: 1,
        count: 1,
        consecutive_wins_count: "$lastDocument.consecutive_wins_count",
        create_at: "$lastDocument.create_at"
      }
    }, {$sort: {"create_at": -1}}, {$skip: page * limit}, {$limit: limit},])


    ctx.body = {
      code: '200', success: true, msg: 'ok', data: games
    }
  })

  app.get('/api/v1/game/gameData/info', async (ctx, next) => {

    let params = ctx.params
    let userId = params.user_id
    let type = params.type
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    let Battle = ctx.model("battle")
    let Game = ctx.model("game")
    let typeList = ['Bitcoin', 'Ethererum', 'Ton']
    let n = []
    let total_type_game_count = 0
    let total_tegen_coins = 0
    if (type == 'adventure') {
      total_type_game_count = await Reward.getRowsCount({user_id: userId, type: 'adventure_game', coins: {$ne: 0}})
     let t_coins= await Reward.agg([{
        $match: {
          user_id: userId, type: 'adventure_game',
        }
      }, {
        $group: {
          _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {
        $project: {
          coins: 1, count: 1,
        }
      }, {$sort: {"num": -1}},])
      total_tegen_coins =t_coins&&t_coins.length > 0 ? t_coins[0]['coins'] : 0
      for (let i = 0; i < typeList.length; i++) {
        let gameAdd = await Reward.agg([{
          $match: {
            user_id: userId, type: 'adventure_game', 'trading_pair': typeList[i], coins: {$gt: 0}
          }
        }, {
          $group: {
            _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
          }
        }, {
          $project: {
            coins: 1, count: 1,
          }
        }, {$sort: {"num": -1}},])

        let gameSub = await Reward.agg([{
          $match: {
            user_id: userId, type: 'adventure_game', 'trading_pair': typeList[i], coins: {$lt: 0}
          }
        }, {
          $group: {
            _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
          }
        }, {
          $project: {
            coins: 1, count: 1,
          }
        }, {$sort: {"num": -1}},])
        let coinAdd = gameAdd.length > 0 ? gameAdd[0]['coins'] : 0
        let coinSub = gameSub.length > 0 ? gameSub[0]['coins'] : 0
        let coinAddCount = gameAdd.length > 0 ? gameAdd[0]['count'] : 0
        let coinSubCount = gameSub.length > 0 ? gameSub[0]['count'] : 0
        console.log(coinAddCount);
        console.log(coinSubCount);
        n.push({
          trading_pair: typeList[i],
          coins: coinAdd + coinSub,
          rate: coinAddCount == 0 ? 0 : coinAddCount / (coinAddCount + coinSubCount)
        })
      }
    } else if (type == 'pk') {
      total_type_game_count = await Battle.getRowsCount({
        $or: [{invite_user_id: userId}, {be_invite_user_id: userId}],
        status: {$ne: 'pending'}
      })
      let t_coins= await Reward.agg([{
        $match: {
          user_id: userId, type: 'pk',
        }
      }, {
        $group: {
          _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {
        $project: {
          coins: 1, count: 1,
        }
      }, {$sort: {"num": -1}},])
      total_tegen_coins =t_coins&&t_coins.length > 0 ? t_coins[0]['coins'] : 0
      for (let i = 0; i < typeList.length; i++) {
        let gameAdd = await Reward.agg([{
          $match: {
            user_id: userId, type: 'pk', 'trading_pair': typeList[i], coins: {$gt: 0}
          }
        }, {
          $group: {
            _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
          }
        }, {
          $project: {
            coins: 1, count: 1,
          }
        }, {$sort: {"num": -1}},])

        let gameSub = await Reward.agg([{
          $match: {
            user_id: userId, type: 'pk', 'trading_pair': typeList[i], coins: {$lt: 0}
          }
        }, {
          $group: {
            _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
          }
        }, {
          $project: {
            coins: 1, count: 1,
          }
        }, {$sort: {"num": -1}},])
        let coinAdd = gameAdd.length > 0 ? gameAdd[0]['coins'] : 0
        let coinSub = gameSub.length > 0 ? gameSub[0]['coins'] : 0
        let coinAddCount = gameAdd.length > 0 ? gameAdd[0]['count'] : 0
        let coinSubCount = gameSub.length > 0 ? gameSub[0]['count'] : 0
        console.log(coinAddCount);
        console.log(coinSubCount);
        n.push({
          trading_pair: typeList[i],
          coins: coinAdd + coinSub,
          rate: coinAddCount == 0 ? 0 : coinAddCount / (coinAddCount + coinSubCount)
        })
      }

    } else {
      for (let i = 0; i < typeList.length; i++) {
        let gameAdd = await Reward.agg([{
          $match: {
            user_id: userId, type: 'zen_game', 'trading_pair': typeList[i], coins: {$gt: 0}
          }
        }, {
          $group: {
            _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
          }
        }, {
          $project: {
            coins: 1, count: 1,
          }
        }, {$sort: {"num": -1}},])
        let coinAdd = gameAdd.length > 0 ? gameAdd[0]['coins'] : 0

        n.push({
          trading_pair: typeList[i], coins: coinAdd
        })
      }
    }
    let wins = await Reward.getLimitRows({user_id: userId, type: 'adventure_game',}, {consecutive_wins_count: -1})
    let count = await Reward.getRowsCount({user_id: userId, type: 'adventure_game', coins: {$ne: 0}})
    let user = await User.getRow({user_id: userId})
    let total = await Reward.agg([{
      $match: {
        user_id: userId,
      }
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {
      $project: {
        coins: 1, count: 1,
      }
    }, {$sort: {"num": -1}},])


    return ctx.body = {
      code: '200',
      success: true,
      msg: 'ok',
      data: n,
      coins: total.length > 0 ? total[0].coins : 0,
      user: user,
      total_count: count,
      total_tegen_coins: total_tegen_coins,
      total_type_game_count: total_type_game_count,
      consecutive_wins_count: wins.length > 0 ? wins[0]['consecutive_wins_count'] : 0
    }
  })

  app.post('/api/v1/game/zen/submitGameData', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let is_success = params.is_success
    let result = params.result
    let User = ctx.model("user")
    let Reward = ctx.model("reward")
    let Game = ctx.model("game")
    let ZenCd = ctx.model("zenCd")
    let Room = ctx.model("room")

    let coin = setting.zen.coin
    let u = await User.getRow({user_id: userId})
    let game = await Game.getRow({_id: mongoose.Types.ObjectId(gameId)})
    /*      if (moment().valueOf() - game.update_at < 1000) {
              return ctx.body = {
                  code: '200', success: false, msg: 'Time less than 1 second', data: {}
              }
          }*/
    let row = await ZenCd.getLimitRows({user_id: userId}, {_id: -1}, 1)
    let q = {user_id: userId}
    let num = 0
    if (row.length > 0) {
      if (moment().valueOf() - row[0].create_at < setting.zen.cd) {
        return ctx.body = {
          code: '202', success: false, msg: 'Time less than 10 minute', data: {}
        }
      }
      q['create_at'] = {$gte: row[0].create_at}
      num = row[0].num + 1
    }

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
    console.log(game);

    coins = await Reward.agg([{$match: {user_id: userId}}, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

    ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        user: u,
        register: u.register ? true : false,
        coins: coins.length > 0 && coins[0]['coins'] ? coins[0]['coins'] : 0
      }
    }
  })

}
