let schema = require('./base/model')({
  name: {type: String, default: ''},
  create_at: {type: Number, default: Date.now},
  update_at: {type: Number, default: Date.now},
}, "pond");
schema.index({name: 1})
module.exports = schema
