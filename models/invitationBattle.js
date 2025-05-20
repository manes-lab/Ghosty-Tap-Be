let schema = require('./base/model')({
  invite_user_id: {type: String, default: ''},
  be_invite_user_id: {type: String, default: ''},
  trading_pair: {type: String, default: ''},
  trade_no: {type: String, default: ''},
  coins: {type: Number, default: 0},
  status: {type: Number, default: 0}, //0: 等待中, 1: 已接受, 2: 已拒绝
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "invitation_battle");

schema.index({be_invite_user_id: 1})
schema.index({invite_user_id: 1})

module.exports = schema
