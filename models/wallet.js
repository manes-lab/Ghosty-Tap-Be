let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  address: {type: String, default: ''},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "wallet");
schema.index({user_id: 1})
module.exports = schema
