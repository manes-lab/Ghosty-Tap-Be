let schema = require('./base/model')({
    user_id: {type: String, default: ''},
    type:{type: String, default: ''},
    trading_pair:{type: String, default: ''},
    is_end:{type: Boolean, default:false},
    result:{type: String, default: ''},
    is_success:{type: Number, default:2},
    num: {type: Number, default: 0},
    end_time: {type: Number, default: 0},
    create_at: {type: Number, default: Date.now},
    update_at: {type: Number, default: Date.now},
}, "game");
schema.index({user_id: 1})
schema.index({create_at: 1})
schema.index({user_id: 1, num: 1,type:1}, {unique: 1})
schema.index({trading_pair: 1})
module.exports = schema
