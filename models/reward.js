let schema = require('./base/model')({
  user_id: {type: String, default: ''},
  activity_id: {type: String, default: ''},
  examination_id: {type: String, default:''},
  game_id: {type: String, default:''},
  battle_id: {type: String, default:''},
  floor_id: {type: String, default:''},
  type: {type: String, default:''}, //floor  exam activity invite
  end_time: {type: Number, default: 0},
  trading_pair:{type: String, default: ''},
  consecutive_wins_count: {type: Number, default: 0},
  is_withdraw: {type: Boolean, default: false},
  extra: {type: Boolean, default: false},
  pts: {type: Number, default: 0},
  usdt: {type: Number, default: 0},
  coins: {type: Number, default: 0},
  claim_day:{type: String, default: ''}, // YYYY-dd-mm 每天最多领取3次
  num: {type: Number, default: 0},
  time: {type: Number, default: 0},
  trade_no: {type: String, default: ''},
  from: {type: String, default: ''},
  update_at: {type: Number, default: Date.now},
  create_at: {type: Number, default: Date.now},
}, "reward");
schema.index({user_id: 1})
schema.index({user_id: 1,type: 1})
schema.index({activity_id: 1})
schema.index({examination_id: 1})
schema.index({game_id: 1})
schema.index({floor_id: 1})
schema.index({trading_pair: 1})
schema.index({type: 1})
schema.index({user_id: 1,is_withdraw: 1})
schema.index({user_id: 1,claim_day: 1})
schema.index({user_id: 1,is_withdraw: 1,usdt: 1})

module.exports = schema
