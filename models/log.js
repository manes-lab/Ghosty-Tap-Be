let schema = require('./base/model')({
  params: {type: {}, default: {}},
  url: {type: String, default: ''},
  create_at: {type: Number, default: Date.now},
}, "logs");
schema.index({url: 1})
module.exports = schema
