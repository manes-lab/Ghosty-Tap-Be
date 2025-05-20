var pomelo = require('pomelo');
var app = pomelo.createApp();
app.set('name', 'tegen-tap');
let filter = require('./plugins/filter');
const appRoot = require('app-root-path');
const db = require("./plugins/db.js")
const priceService = require("./plugins/priceFeeder.js")
// const { initWebsocket } = require('./app/util/websocket');

app.configure('production|development', function(){
  	let options = app.get('env') =='development' ? require(appRoot + "/../config/dev.json") : require(appRoot + "/../config/main.json")
	app.set('options', options)
	app.load('db', db)
    app.filter(filter());
});

// app configuration
app.configure('production|development', 'connector', function(){
	app.set('connectorConfig',
	{
		connector : pomelo.connectors.sioconnector,
		// 'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
		transports : ['polling'],
		// heartbeats : 3,
		// disconnectOnTimeout: true,
		// timeout: 10
		// closeTimeout : 60 * 1000,
		heartbeatTimeout : 60 * 1000,
		heartbeatInterval : 5 * 1000
	});
});

app.configure ('production|development', 'singleton', function() {
	app.load('priceService', priceService);
});


app.configure('production', function() {
   process.env.NODE_ENV='production'
   console.log('production');
});

app.configure('development', function() {
  process.env.NODE_ENV='development'
  console.log('development');
});



process.on('uncaughtException', function (err) {
	console.error(' Caught exception: ' + err.stack);
});


app.start();


