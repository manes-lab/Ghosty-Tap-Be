const moment = require("moment");
const mongoose = require("mongoose");
module.exports = function (app) {
  app.get('/api/v1/squares/onlineUsers', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Room = ctx.model("room")
    let User = ctx.model("user")
    let Square = ctx.model("square")
    //Available
    //Playing
    let squares = await Square.getRows({})
    for (let i = 0; i < squares.length; i++) {
      let r = await Room.getRows({user_id: squares[i].user_id})
      let u = await User.getRow({user_id: squares[i].user_id})
      squares[i].status = r ? 'Playing' : 'Available'
      squares[i].user = u
    }
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: squares
    }

  })

  app.get('/api/v1/squares/userStatus', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let battleUserId = params.battle_user_id
    let inviteId = params.invite_id
    let Room = ctx.model("room")
    let User = ctx.model("user")
    let Square = ctx.model("square")
    let Block = ctx.model("block")
    let Reward = ctx.model("reward")
    let Battle = ctx.model("battle")
    let System = ctx.model("system")
    let InvitationBattle = ctx.model("invitationBattle")
    //Available
    //Playing
    let system = await System.getRow({user_id: battleUserId})
    let s = await Square.getRow({user_id: battleUserId})
    let r = await Room.getRow({user_id: battleUserId, room_name: 'adventure'})
    let u = await User.getRow({user_id: battleUserId})
    let b = await Block.getRow({
      userId: userId, block_user_id: battleUserId, create_at: {$gte: (moment().valueOf() - 1000 * 60 * 60 * 24)}
    })
    let is_sate = false
    let is_timeout = false
    if (inviteId) {
      let invitation = await InvitationBattle.getRow({
        _id: mongoose.Types.ObjectId(inviteId)
      })
      let invite_coins = await Reward.agg([{$match: {user_id: invitation.invite_user_id}}, {
        $group: {
          _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
      let t_invite_coins = invite_coins && invite_coins.length > 0 ? invite_coins[0].coins : 0
      if (!invitation.be_invite_user_id){
        /*url分享 没有be_invite_user_id */
        invitation.be_invite_user_id=userId
      }
      let be_invite_coins = await Reward.agg([{$match: {user_id: invitation.be_invite_user_id}}, {
        $group: {
          _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
        }
      }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])
      console.log('be_invite_user_id ',invitation.be_invite_user_id);
      let t_be_invite_coins = be_invite_coins && be_invite_coins.length > 0 ? be_invite_coins[0].coins : 0
      console.log(t_invite_coins);
      console.log(t_be_invite_coins);
      console.log(invitation.coins);

      is_sate = (t_invite_coins >= invitation.coins && t_be_invite_coins >= invitation.coins) ? true : false
      let now = moment().valueOf()
      let battle = await Battle.getRow({invite_id: inviteId,})
      is_timeout = (now - invitation.create_at > 1000 * 60 * 60) || battle ? true : false
    }

    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        status: b ? "Block" : s ? (r&&system&&system.adventure_refuse ? 'Playing' : 'Available') : "OffLine",
        is_sate: is_sate,
        is_timeout: is_timeout,
      }
    }

  })

  app.post('/api/v1/squares/setBlock', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let battleUserId = params.battle_user_id
    let isBlock = params.is_block
    let Block = ctx.model("block")

    if (isBlock) {
      await Block.createRow({user_id: userId, block_user_id: battleUserId})
    } else {
      await Block.deleteRows({user_id: userId, block_user_id: battleUserId})
    }

    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {}
    }

  })


  app.post('/api/v1/squares/urlInvitationForBattle', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let beInvitedUserId = params.be_invite_user_id
    let tradingPair = params.trading_pair
    let coins = params.coins
    let Mail = ctx.model("mail")
    let User = ctx.model("user")
    let Square = ctx.model("square")
    let InvitationBattle = ctx.model("invitationBattle")
    let trade_no = 'Tx-' + userId + moment().valueOf()
    //Available
    //Playing
    if (coins<=0){
      return ctx.body = {
        code: '200', success: false, msg: 'coins must > 0', data: null
      }
    }
    await InvitationBattle.createRow({
      trade_no: trade_no,
      invite_user_id: userId,
      be_invite_user_id: beInvitedUserId,
      trading_pair: tradingPair,
      coins: coins,
      status: 0
    })
/*    await Mail.createRow({
      trade_no: trade_no, send_user_id: userId, recipient_user_id: beInvitedUserId, status: 'View'
    })*/
    let  invitation =await InvitationBattle.getRow({trade_no: trade_no})
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        invitation:invitation
      }
    }

  })


  app.get('/api/v1/squares/getInvitationForBattle', async (ctx, next) => {
    let params = ctx.params
    let inviteId = params.invite_id
    let userId = params.user_id
    let InvitationBattle = ctx.model("invitationBattle")
    let Room = ctx.model("room")
    let User = ctx.model("user")
    let Square = ctx.model("square")
    let Block = ctx.model("block")
    let Reward = ctx.model("reward")
    let row = await InvitationBattle.getRow({
      _id: mongoose.Types.ObjectId(inviteId),
    })
    if (!inviteId || !userId) {
      return ctx.body = {
        code: '200', success: false, msg: 'params must', data: {}
      }
    }

    let battleUserId = (!row.be_invite_user_id||userId == row.be_invite_user_id) ? row.invite_user_id : row.be_invite_user_id
    let s = await Square.getRow({user_id: battleUserId})
    let r = await Room.getRow({user_id: battleUserId, room_name: 'adventure'})
    let u = await User.getRow({user_id: battleUserId})
    let b = await Block.getRow({
      userId:battleUserId , block_user_id: userId, create_at: {$gte: (moment().valueOf() - 1000 * 60 * 60 * 24)}
    })

    let pkGameAdd = await Reward.getRowsCount({user_id: battleUserId, type: 'pk','trading_pair':row.trading_pair ,coins: {$gt: 0}})
    let pkGameSub = await Reward.getRowsCount({user_id: battleUserId, type: 'pk','trading_pair':row.trading_pair, coins: {$lt: 0}})
    let adventureGameAdd = await Reward.getRowsCount({user_id: battleUserId, type: 'adventure_game','trading_pair':row.trading_pair, coins: {$gt: 0}})
    let adventureGameSub = await Reward.getRowsCount({user_id: battleUserId, type: 'adventure_game','trading_pair':row.trading_pair, coins: {$lt: 0}})
    let coins = await Reward.agg([{$match: {user_id: battleUserId}}, {
      $group: {
        _id: null, coins: {$sum: "$coins"}, count: {$sum: 1}
      }
    }, {$project: {coins: 1, count: 1}}, {$sort: {"count": -1}},])

    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        invitation: row,
        battle_user: u,
        coins: coins && coins.length > 0 ? coins[0].coins : 0,
        status: b ? "Block" : s ? (r ? 'Playing' : 'Available') : "OffLine",
        pvp_rate: (pkGameAdd + pkGameSub) > 0 ? (pkGameAdd / (pkGameAdd + pkGameSub)).toFixed(2) : 0,
        pve_rate: (adventureGameAdd + adventureGameSub) > 0 ? (adventureGameAdd / (adventureGameAdd + adventureGameSub)).toFixed(2) : 0

      }
    }
  })


  app.get('/api/v1/squares/mailList', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let type = params.type //Inbox  Sent
    let Mail = ctx.model("mail")
    let User = ctx.model("user")
    let Battle = ctx.model("battle")
    let InvitationBattle = ctx.model("invitationBattle")
    let page = params.page ? +params.page : 0
    let limit = params.limit ? +params.limit : 10
    let now = moment().valueOf()
    let list = []
    if (type == "Inbox") {
      list = await Mail.getPagedRows({recipient_user_id: userId}, page * limit, limit, {_id: -1})
    } else {
      list = await Mail.getPagedRows({send_user_id: userId}, page * limit, limit, {_id: -1})
    }
    let  n =[]
    for (let i = 0; i < list.length; i++) {
      let user = await User.getRow({user_id: type == "Inbox" ? list[i].send_user_id : list[i].recipient_user_id})
      let invitation = await InvitationBattle.getRow({ trade_no: list[i].trade_no})
      if (now - list[i].create_at > 60 * 60 * 1000) {
        list[i].status = list[i].status == 'View' ? "Expired" : list[i].status
      }

      list[i].invite_id =invitation? invitation._id:""
      list[i].send_user = user
      if (invitation){
        n.push(list[i])
      }
    }

    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: n
    }
  })

  app.get('/api/v1/squares/viewInvitation', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let trade_no = params.trade_no
    let Mail = ctx.model("mail")
    let User = ctx.model("user")
    let Battle = ctx.model("battle")
    let InvitationBattle = ctx.model("invitationBattle")
    let invitation = await InvitationBattle.getRow({
      trade_no: trade_no
    })

    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: invitation
    }
  })



  async function getPlayerStatus(Square, Room, Battle, userId) {
    let s = await Square.getRow({user_id: userId})
    let r = await Room.getRow({user_id: userId, room_name: "adventure"})
    let b = await Battle.getRow({$or: [{invite_user_id: userId}, {be_invite_user_id: userId}], status: "pending"})
    if (r || b) {
      return "Playing"
    }
    if (s) {
      return "Available"
    }
    return "offLine"
  }

  function getGameStatus() {


  }

}
