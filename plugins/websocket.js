const WebSocket = require ("ws")
let webSocketServer = require('websocket').server;
let http = require('http');
let schedule = require("node-schedule");
const config = require('config');

let ws;
let interval
let pong = true

const startHeartCheck = () => {
    clearInterval(interval)
    interval = setInterval(() => {
        if (pong == false) {
            initClient();
            clearInterval(interval)
            return
        }
        pong = false
        ws?.send("ping")
    }, 30 * 1000)
}

async function initClient() {
    ws?.close();
    try {
        let url = config.get('websocket').host
        ws = new WebSocket(url);
        ws.onopen = () => {
            startHeartCheck()
            ws?.send(JSON.stringify({
                subscribe: 'new',
                args:{}
            }))
        };

        ws.onmessage = (e) => {
            if (e.data == "pong") {
                pong = true
                return
            }
            const data = e.data.indexOf("{")>-1 ? JSON.parse(e.data) : {};
            send(data.subscribe, data.channel, data.data)
        };

        ws.onerror = (e) => {
            console.log('error', e);
            initClient()
        };

        ws.onclose = (e) => {
            console.log('close');
        };
    } catch(e) {
        console.log(e)
        initClient()
    }

}


const ESubscribe = {
    Notification: "notification",
    Drip: "drip",
    Feed: "feed",
}

let connections = {}
let subscribes = {}

async function resolveMsg(message, key) {

    if (message.utf8Data == "ping") {
        connections[key].createAt = Date.now()
        connections[key].connection.sendUTF("pong")
        return
    }

    let data = {}

    try {
        data = JSON.parse(message.utf8Data)
    } catch (e) {
        return
    }

    const channel = data['channel']
    const subscribe = data['subscribe']
    const args = data['args']

    if (!subscribes[subscribe][channel]) {
        subscribes[subscribe][channel] = []
    }

    if (!subscribes[subscribe][channel].includes(key)) {
        subscribes[subscribe][channel].push(key)
    }

    connections[key].connection.sendUTF(JSON.stringify({
        subscribe,
        channel,
        data: {
            success: true
        }
    }))
}

async function loop() {
    const now = Date.now()
    for (let key in connections) {
        const connection = connections[key]
        if (now - connection.createAt > 1000 * 60) {
            connection.close()
            delete connections[key]
        }
    }
}

async function send(subscribe, channel, data) {
    try {
        const msg = {
            subscribe,
            channel,
            data
        }
        console.log('send push subscribe ', subscribe, channel);
        console.log('send push step ', subscribes[subscribe][channel]);
        if (subscribes[subscribe][channel]) {
            for (let key of subscribes[subscribe][channel]) {
                console.log('send push', key);
                const connection = connections[key].connection
                if (!connection) {
                    delete subscribes[subscribe][channel][key]
                }
                connection.sendUTF(JSON.stringify(msg))
            }
        }

    } catch (e) {
       // console.log('106',e);

    }
}

async function initServer() {
    for (let key in ESubscribe) {
        subscribes[ESubscribe[key]] = {}
    }

    let server = http.createServer(function (request, response) {

    });
    const port = Number(config.get('websocket').port) + Number(process.env.NODE_APP_INSTANCE)

    server.listen(port, function () {
        console.log((new Date()) + " Server is listening on port " + port);
    });

    let wsServer = new webSocketServer({
        httpServer: server
    });

    wsServer.on('request', function (request) {
        let connection = request.accept(null, request.origin);
        connections[request.key] = {
            createAt: Date.now(),
            connection: connection
        }
        //  console.log((new Date()) + ' Connection accepted.');

        connection.on('message', function (message) {
            if (message.type != 'utf8') {
                return
            }
            resolveMsg(message, request.key)
        });

        connection.on('close', function (connection) {
            console.log("disconnect")
            delete connections[connection.key]
        });

    });

    schedule.scheduleJob('60 * * * * *', async function () {
        loop()
    })
}

module.exports = {
    initClient,
    initServer,
    send,
    ESubscribe
}
