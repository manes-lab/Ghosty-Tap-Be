let schema = require('./base/model')({
  username: {type: String, default: ''},
  code: {type: String, default: ''},
  user_id: {type: String, default: '000'},
  register: {type: Boolean, default: false},
  photo_url: {type: String, default: ''},
  avatar: {type: String, default: '1'},
  is_follow: {type: Boolean, default: false},
  is_join: {type: Boolean, default: false},
  first_name: {type: String, default: ''},
  last_name: {type: String, default: ''},
  email: {type: String, default: ''},
  channel_id: {type: String, default: ''},
  create_at: {type: Number, default: 0},
  async_time: {type: Date, default: Date.now}
}, "users");
schema.index({create_at: 1})
schema.index({user_id: 1}, {unique: true})

module.exports = schema
