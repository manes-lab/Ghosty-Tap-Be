let schema = require('./base/model')({
    user_id: {type: String, default: ''},
    game_id: {type: String, default: ''},
    trading_pair:{type: String, default: ''},
    result:{type: String, default: ''},
    is_success:{type: Number, default:2},//0失败 1成功 2 平局 3 无操作
    num:{type: Number, default:0},
    trade_no: {type: String, default: ''},
    end_time: {type: Number, default: 0},
    create_at: {type: Number, default: Date.now},
    update_at: {type: Number, default: Date.now},
}, "game_data");
schema.index({user_id: 1})
schema.index({game_id: 1})
schema.index({create_at: 1})
schema.index({trading_pair: 1})
module.exports = schema
