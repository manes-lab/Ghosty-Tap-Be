let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  be_help_user_id: {type: String, default:''},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "help");
schema.index({user_id: 1})
schema.index({be_help_user_id: 1})
module.exports = schema
