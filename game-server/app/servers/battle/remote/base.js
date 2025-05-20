const mongoose = require("mongoose");
const moment = require("moment");

module.exports = function (app) {
  return new Battle(app);
};

let Battle = function (app) {
  this.app = app;
  this.channelService = app.get('channelService');
  this.db = app.components['db']
};


Battle.prototype.leave = async function (userId, battleId, cb) {
  let self = this
  let Battle = this.db.model("battle")
  let Reward = this.db.model("reward")
  let battle = await Battle.getRow({_id: mongoose.Types.ObjectId(battleId)})

  if (battle.invite_user_status == 1 && battle.be_invite_user_status == 1 && battle.status=='pending'){
    if (userId == battle.invite_user_id) {
      await Battle.updateRow({_id: battle['_id']}, {status: 'fail', invite_user_status: 2, be_invite_user_status: 2})
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
      await Battle.updateRow({_id: battle['_id']}, {
        status: 'success',
        invite_user_status: 2,
        be_invite_user_status: 2
      })
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
    }
  }

  self.app.rpc.space.base.pushMessage(null, battle.invite_user_id, 'battleOver', {battle_id: battle['_id'], reason: "leave"}, () => {
    console.log("push", battle.invite_user_id, 'battleOver', {battle_id: battle['_id']})
  })
  self.app.rpc.space.base.pushMessage(null, battle.be_invite_user_id, 'battleOver', {battle_id: battle['_id'], reason: "leave"}, () => {
    console.log("push", battle.be_invite_user_id, 'battleOver', {battle_id: battle['_id']})
  })
};