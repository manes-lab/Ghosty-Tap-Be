let schema = require('./base/model')({
  invite_user_id: {type: String, default: ''},
  be_invite_user_id: {type: String, default: ''},
  invite_user_coins: {type: Number, default: 0},
  be_invite_user_coins: {type: Number, default: 0},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "invitation");

schema.index({be_invite_user_id: 1})
schema.index({invite_user_id: 1})

module.exports = schema
