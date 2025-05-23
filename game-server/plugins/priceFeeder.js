const axios = require("axios")
const WebSocket = require('ws');
let ws = {}

function newWebSocket(instId, callback) {
    ws[instId]?.close()

    let url = "wss://tegentap.com/ws/v5/business"
    
    ws = new WebSocket(url);

    let channels = [
        {"channel": "candle1s", "instId": instId},
    ]
    let subParam = {"op": "subscribe", "args": channels}

    ws.onopen = () => {
        console.log("websocket initialized")
        ws?.send(JSON.stringify(subParam))
    };

    ws.onmessage = (e) => {
        const data = e.data.indexOf("{")>-1 ? JSON.parse(e.data) : null;
        callback(data)
    };

    ws.onerror = (e) => {
        console.log('error', e);
        newWebSocket(instId, callback)
    };

    ws.onclose = (e) => {
        console.log('close', e);
        newWebSocket(instId, callback)
    };

    ws[instId] = ws
}

async function getCandles(instId) {
  return await axios.get(`https://api.binance.com/api/v3/klines?symbol=${instId}&interval=1s`)
}



const INST_IDS = ["BTC-USDT", "ETH-USDT"]
const tradingPairMap = {
  'Bitcoin': 'BTC-USDT',
  'Ethererum': 'ETH-USDT',
}

var PriceService = function(app, opts) {
  opts = opts || {};
  this.app = app;
  this.bars = {}
};

module.exports = function(app, opts) {
  return new PriceService(app, opts);
};


PriceService.prototype.start = function(cb) {
  let get = async (instId) => {
    // let res = await getCandles(instId.replace("-", ""))
    // for (let bar of res.data) {
    //   this.bars[instId].push(bar.slice(0, 5))
    // }
    newWebSocket(instId + "-SWAP", (data) => {
    //  console.log(data)
      if (data.event) {
        return
      }
      let key = data.arg.instId.split("-SWAP")[0]
      this.bars[key].push(data.data[0])
      if (this.bars[key].length > 500) {
        this.bars[key].shift()
      } else {
      //  console.log(key, "bars length: ", this.bars[key].length)
      }
      
    })
  }
  for (let instId of INST_IDS) {
    console.log("initializing...", instId)
    this.bars[instId] = []
    get(instId)
  }
  process.nextTick(cb);
};

PriceService.prototype.afterStart = function (cb) {
  process.nextTick(cb);
}


PriceService.prototype.getRandom = async function ({instId, count, limit}) {
  instId = tradingPairMap[instId]
  let bars = []
  for (let i = 0; i < count; i ++) {
    let index = Math.floor(Math.random() * (this.bars[instId].length - limit))
    bars.push(this.bars[instId].slice(index, index + limit))
  }
  return bars
};


