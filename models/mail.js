let schema = require('./base/model')({
  send_user_id: {type: String, default: '000'},
  recipient_user_id: {type: String, default: ''},
  trade_no: {type: String, default: ''},
  status: {type: String, default: ''},//View Expired  Declined  Battled
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "mail");

schema.index({user_id: 1})

module.exports = schema
