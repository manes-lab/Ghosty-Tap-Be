let schema = require('./base/model')({
  user_id: {type: String, default: ''},
  code: {type: String, default: ''},
  create_at: {type: Number, default: Date.now},
}, "invite_code");
schema.index({code: 1},{unique: true})
schema.index({user_id: 1})
module.exports = schema
