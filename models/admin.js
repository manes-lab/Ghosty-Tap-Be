let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  hash: {type: String, default:''},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "admins");
schema.index({user_id: 1})

module.exports = schema
