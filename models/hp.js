let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  value: {type: Number, default:0},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "physical_strength");
schema.index({user_id: 1})
module.exports = schema
