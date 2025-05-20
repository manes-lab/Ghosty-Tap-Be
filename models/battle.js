let schema = require('./base/model')({
  invite_id: {type: String, default: ''},
  invite_user_id: {type: String, default: ''},
  be_invite_user_id: {type: String, default: ''},
  trading_pair: {type: String, default: ''},
  coins: {type: Number, default: 0},
  status: {type: String, default: 0}, //0:pending, 1: success, 2: fail
  win_user: {type: String, default: ''},
  invite_user_coins: {type: Number, default: 0},
  invite_user_status: {type: Number, default: 0},  //0: pending, 1: ready, 2: finish
  be_invite_user_status: {type: Number, default: 0},
  be_invite_user_coins: {type: Number, default: 0},
  data: {type: {}, default: {}},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "battle");

schema.index({be_invite_user_id: 1})
schema.index({invite_user_id: 1})
schema.index({invite_id: 1}, {unique: true})
module.exports = schema
