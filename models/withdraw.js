let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  address: {type: String, default: ''},
  trade_no: {type: String, default: ''},
  status: {type: String, default: '0'}, //0  1： In progress  2:refuse 3：Pending review  4：Completed
  reward_Ids: {type: [], default:[]},
  hashes: {type: [], default:[]},
  usdt: {type: Number, default: 0},
  num: {type: Number, default: 0},
  is_withdraw: {type: Boolean, default: false},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "withdraw");
schema.index({user_id: 1})
module.exports = schema
