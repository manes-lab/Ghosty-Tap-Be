let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  adventure_refuse: {type: Boolean, default: false},
  pk_refuse: {type: Boolean, default: false},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "system");
schema.index({user_id: 1}, {unique: true})
module.exports = schema
