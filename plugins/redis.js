'use strict';

let Redis = require('ioredis');

module.exports = function(options) {
  options = options || {};
  var client = new Redis(options);
  client.on('error', function(e) {
    console.error("error:" + e);
  });
  client.on('connect', function(e) {
    console.log("# redis connected.");
  });
  client.on('close', function(e) {
    console.log("close:" + e);
  });

  return async function(ctx, next) {
    ctx.redis = client;
    await next();
  }
}
