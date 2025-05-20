const {checkMember} = require("../../../utils/telegram/api");
const config = require("config");
const moment = require("moment");
const mongoose = require("mongoose");
const setting = require("../setting/degen.json");
module.exports = function (app) {
  app.get('/api/v1/rank/day/top3andTotalCoins', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let User = ctx.model("user")
    let q = {
      create_at: {$gte: moment(moment().format('YYYY-MM-DD')).valueOf(), $lte: moment().valueOf()}
    }
    let reward = await Reward.agg([{$match: q}, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 3}])
    let n = []
    for (let i = 0; i < reward.length; i++) {
      let u = await User.getRow({user_id: reward[i]['_id']})
      n.push({
        user: u, coins: reward[i]['coins']
      })
    }

    let total_coins = await Reward.agg([{
      $match: {
        coins: {$gte: 0},type : {$ne:'pk'},
      }
    }, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 3}])
    return ctx.body = {
      code: '200',
      success: true,
      msg: 'ok',
      data: {rank: n, total_coin_mined: total_coins.length > 0 ? total_coins[0]['coins'] : 0}
    }

  })

  app.get('/api/v1/rank/day', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let User = ctx.model("user")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let q = {
      create_at: {$gte: moment(moment().format('YYYY-MM-DD')).valueOf(), $lte: moment().valueOf()}
    }
    let reward = await Reward.agg([{$match: q}, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$skip: page * limit}, {$limit: limit}])
    let n = []
    for (let i = 0; i < reward.length; i++) {
      let u = await User.getRow({user_id: reward[i]['_id']})
      n.push({
        user: u, coins: reward[i]['coins']
      })
    }

    let total_coins = await Reward.agg([{
      $match: {
        create_at: {$gte: moment(moment().format('YYYY-MM-DD')).valueOf(), $lte: moment().valueOf()}
      }
    }, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 100}])

    let rankPoints = []
    for (let i = 0; i < total_coins.length; i++) {
      rankPoints.push(total_coins[i]['_id'])
    }

    let position = rankPoints.indexOf(userId)
    let user = await User.getRow({user_id: userId})
    let current_user = await Reward.agg([{
      $match: {
        ...q,
        user_id: userId
      }
    }, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 100}])
    user['coins'] = current_user.length > 0 ? current_user[0]['coins'] : 0
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        rank: n, position: position + 1, user: user
      }
    }

  })

  app.get('/api/v1/rank/week', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let User = ctx.model("user")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let start = moment().week(moment().week()).startOf('week').valueOf();
    let end = moment().week(moment().week()).endOf('week').valueOf();


    let q = {
      create_at: {$gte: start, $lte: end}
    }
    let reward = await Reward.agg([{$match: q}, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$skip: page * limit}, {$limit: limit}])
    let n = []
    for (let i = 0; i < reward.length; i++) {
      let u = await User.getRow({user_id: reward[i]['_id']})
      n.push({
        user: u, coins: reward[i]['coins']
      })
    }

    let total_coins = await Reward.agg([{
      $match: {
        create_at: {$gte: start, $lte: end}
      }
    }, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 100}])

    let rankPoints = []
    for (let i = 0; i < total_coins.length; i++) {
      rankPoints.push(total_coins[i]['_id'])
    }

    let position = rankPoints.indexOf(userId)
    let user = await User.getRow({user_id: userId})
    let current_user = await Reward.agg([{
      $match: {
        ...q,
        user_id: userId
      }
    }, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 100}])
    user['coins'] = current_user.length > 0 ? current_user[0]['coins'] : 0
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        rank: n,
        user: user,
        position: position + 1
      }
    }

  })
  app.get('/api/v1/rank/total', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Reward = ctx.model("reward")
    let User = ctx.model("user")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let start = moment().week(moment().week()).startOf('week').valueOf();
    let end = moment().week(moment().week()).endOf('week').valueOf();


    let q = {
     // create_at: {$gte: start, $lte: end}
    }
    let reward = await Reward.agg([{$match: q}, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$skip: page * limit}, {$limit: limit}])
    let n = []
    for (let i = 0; i < reward.length; i++) {
      let u = await User.getRow({user_id: reward[i]['_id']})
      n.push({
        user: u, coins: reward[i]['coins']
      })
    }

    let total_coins = await Reward.agg([{
      $match: {
     //   create_at: {$gte: start, $lte: end}
      }
    }, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 100}])

    let rankPoints = []
    for (let i = 0; i < total_coins.length; i++) {
      rankPoints.push(total_coins[i]['_id'])
    }
    console.log('rankPoints ' ,rankPoints);
    let position = rankPoints.indexOf(userId)
    let user = await User.getRow({user_id: userId})
    let current_user = await Reward.agg([{
      $match: {
        ...q,
        user_id: userId
      }
    }, {
      $group: {
        _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$limit: 100}])
    user['coins'] = current_user.length > 0 ? current_user[0]['coins'] : 0
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        rank: n,
        user: user,
        position: position + 1
      }
    }

  })
  app.get('/api/v1/rank/roomRank', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let type = params.type  //type=zen ;adventure ;pk
    let Room = ctx.model("room")
    let User = ctx.model("user")
    let Square = ctx.model("square")
    let Reward = ctx.model("reward")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let count = await Room.getRowsCount({room_name: type})
    let user = await User.getRow({user_id: userId})
    if (!user){
      return ctx.body = {
        code: '200', success: false, msg: 'ok', data: {}
      }
    }
  //  console.log('count' ,count);
    let position=-1
    let rank = []
    if (type=='zen'){
      let userList = await Room.getLimitRows({room_name: type},{_id:1},50)
      let userIds =[]
      for (let i =0 ;i<userList.length; i++){
        userIds.push(userList[i]['user_id'])
      }

      let reward = await Reward.agg([{$match: {user_id:{$in:userIds}, type : "zen_game",}}, {
        $group: {
          _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$skip: page * limit}, {$limit: limit}])

      let rankPoints = []

      for (let i = 0; i < reward.length; i++) {
        rankPoints.push(reward[i]['_id'])
        let u = await User.getRow({user_id: reward[i]['_id']})
        rank.push({
          ...u,
          coins: reward[i]['coins']
        })
      }
      console.log('rankPoints ' ,rankPoints);
      position = rankPoints.indexOf(userId)

      let current_user = await Reward.agg([{$match: {user_id:{$in:userIds}}}, {
        $group: {
          _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {$project: {coins: 1}}, {$sort: {"coins": -1}},])

      user['coins'] =current_user&&current_user.length>0? current_user[0].coins:0

    }else if(type=='pk'){

      let userList = await Square.getLimitRows({},{_id:1},50)
      let userIds =[]
      for (let i =0 ;i<userList.length; i++){
        userIds.push(userList[i]['user_id'])
      }

      let reward = await Reward.agg([{$match: {user_id:{$in:userIds}, type : "pk",}}, {
        $group: {
          _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {$project: {coins: 1}}, {$sort: {"coins": -1}}, {$skip: page * limit}, {$limit: limit}])

      let rankPoints = []

      for (let j =0 ;j<reward.length;j++){
        rankPoints.push(reward[j]['_id'])
      }
      console.log(reward);
      for (let i = 0; i < userList.length; i++) {
        if ( rankPoints.indexOf(userList[i]['user_id'])==-1){
          rankPoints.push(userList[i]['user_id'])
          reward.push({
            _id:userList[i]['user_id'],
            coins:0
          })
        }
      }

      for (let i = 0; i < reward.length; i++) {
        let u = await User.getRow({user_id: reward[i]['_id']})
        rank.push({
          ...u,
          coins: reward[i].coins
        })
      }
      console.log('rankPoints ' ,rankPoints);
      position = rankPoints.indexOf(userId)

      let current_user = await Reward.agg([{$match: {user_id:{$in:userIds}}}, {
        $group: {
          _id: "$user_id", coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {$project: {coins: 1}}, {$sort: {"coins": -1}},])

      user['coins'] =current_user&&current_user.length>0? current_user[0].coins:0
      count = await Square.getRowsCount({})

    }else {
      let userList = await Room.getPagedRows({room_name: type},page*limit,limit,{coins: -1, create_at: -1})
      let rankPoints = []
      for (let i = 0; i < userList.length; i++) {
        rankPoints.push(userList[i]['user_id'])
        let u = await User.getRow({user_id: userList[i]['user_id']})
        rank.push({
          ...u, ...userList[i]
        })
      }
       position = rankPoints.indexOf(userId)
      let current_user = await Room.getRow({room_name: type, user_id: userId})
      user['coins'] =current_user? current_user.coins:0
    }


    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        rank: rank,
        count: count,
        user: user,
        position: position + 1}
    }
  })

}
