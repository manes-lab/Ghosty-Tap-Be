let schema = require('./base/model')({
  user_id: {type: String, default: '000'},
  room_name: {type: String, default:''},
  session_id: {type: Number, default:0},
  coins: {type: Number, default:0},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "rooms");

schema.index({user_id: 1})
schema.index({user_id: 1,room_name:1},{unique:true})
module.exports = schema
