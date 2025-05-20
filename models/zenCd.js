let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  game_id: {type: String, default:''},
  num: {type: Number, default: 0},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "zen_cd");
schema.index({user_id: 1})
schema.index({examination_id: 1})
schema.index({create_at: 1})
module.exports = schema
