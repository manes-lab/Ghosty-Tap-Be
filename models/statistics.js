let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  operation: {type: String, default:''},
  msg: {type: String, default:''},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "statistics");
schema.index({user_id: 1})
schema.index({operation: 1})
module.exports = schema
