let schema = require('./base/model')({
    user_id: {type: String, default: ''},
    battle_id: {type: String, default: ''},
    trading_pair:{type: String, default: ''},
    result:{type: String, default: ''},
    is_success:{type: Number, default:2},
    num:{type: Number, default:0},
    trade_no: {type: String, default: ''},
    end_time: {type: Number, default: 0},
    create_at: {type: Number, default: Date.now},
    update_at: {type: Number, default: Date.now},
}, "game_data_battle");
schema.index({user_id: 1})
schema.index({battle_id: 1})
schema.index({create_at: 1})
schema.index({trading_pair: 1})
module.exports = schema
