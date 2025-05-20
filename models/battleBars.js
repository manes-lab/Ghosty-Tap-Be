let schema = require('./base/model')({
    battle_id: {type: String, default: ''},
    bars: {type: [], default: []},
    create_at: {type: Number, default: Date.now},
    update_at: {type: Number, default: Date.now},
  }, "battle_bars");
  
  schema.index({battle_id: 1})
  module.exports = schema
  