const {getRandomInt} = require("../../../utils/utils");
const config = require("config");
const moment = require("moment");
const setting = require("../setting/degen.json");
module.exports = function (app) {
  app.get('/api/v1/invitation/pond', async (ctx, next) => {
    let params = ctx.params
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: [{invite: '1-5', coins: 3000}, {invite: '5-10', coins: 5000}, {
        invite: '10-20', coins: 10000
      }, {invite: '20-30', coins: 20000}, {invite: '30+', coins: 50000},

      ]
    }

  })


  app.all('/api/v1/invitation/invite', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let code = params.code
    let Invitation = ctx.model("invitation")
    let User = ctx.model("user")
    let InviteCode = ctx.model("InviteCode")
    let Reward = ctx.model("reward")
    let invite = await InviteCode.getRow({code: code})
    if (!invite) {
      return ctx.body = {code: '200', success: false, msg: 'code error', data: {}}
    }
    let u = await User.getRow({user_id: userId})
    if (u) {
      return ctx.body = {code: '200', success: false, msg: 'Already registered', data: {}}
    }
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
    await Invitation.updateOrInsertRow({invite_user_id: invite.user_id, be_invite_user_id: userId}, {
      invite_user_id: invite.user_id, be_invite_user_id: userId
    })
    let count = await Invitation.count({invite_user_id: invite.user_id})
    let rewardCoins = getReward(count)
    await Reward.createRow({
      user_id: userId,
      game_id: '',
      type: 'invite',
      trading_pair: '',
      trade_no: '',
      end_time: moment().valueOf(),
      consecutive_wins_count: 0,
      coins: 3000,
    })
    await Reward.createRow({
      user_id: invite.user_id,
      game_id: '',
      type: 'invite',
      trading_pair: '',
      trade_no: '',
      end_time: moment().valueOf(),
      consecutive_wins_count: 0,
      coins: rewardCoins,
    })
    await Invitation.updateRow({invite_user_id: invite.user_id, be_invite_user_id: userId}, {
      invite_user_coins: rewardCoins,
      be_invite_user_coins: 3000,
    })
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: {
        invite_user :await User.getRow({user_id: invite.user_id}),
        invite_coins:rewardCoins ,
        be_invite_coins: 3000,
      }
    }
  })

  app.get('/api/v1/invitation/inviteList', async (ctx, next) => {
    let params = ctx.params
    let userId = params.user_id
    let Invitation = ctx.model("invitation")
    let User = ctx.model("user")
    let rows = await Invitation.getRows({invite_user_id: userId})
    for (let i = 0; i < rows.length; i++) {
      let user = await User.getRow({user_id: rows[i].be_invite_user_id})
      rows[i].user = user
    }
    return ctx.body = {
      code: '200', success: true, msg: 'ok', data: rows
    }

  })


  function getReward(invites) {
/*
    invites = Math.floor(invites);
    const rewards = [{min: 1, max: 4, coins: 3000}, {min: 5, max: 9, coins: 5000}, {
      min: 10, max: 19, coins: 10000
    }, {min: 20, max: 29, coins: 20000}, {min: 30, max: Infinity, coins: 50000}];
    for (let rule of rewards) {
      if (invites >= rule.min && (invites <= rule.max || rule.max === Infinity)) {
        return rule.coins;
      }
    }
*/


    return 5000; // 或 throw new Error("No matching reward rule found");
  }

}
