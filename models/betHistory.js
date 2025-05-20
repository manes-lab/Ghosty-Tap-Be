let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  num: {type: Number, default: 0},
  coins: {type: Number, default: 0},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "bet_history");
schema.index({user_id: 1})
schema.index({examination_id: 1})
schema.index({create_at: 1})
module.exports = schema
