let schema = require('./base/model')({
  num: {type: Number, default:0},
  withdraw_id: {type: String, default: '000'},
  solve: {type: Number, default: 0}, //1success 2 fail
  is_use: {type: Boolean, default: false},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "queue");
schema.index({user_id: 1})

module.exports = schema
