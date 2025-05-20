
module.exports = function (app) {
  return new Singleton(app);
};

let Singleton = function (app) {
  this.app = app;
  this.channelService = app.get('channelService');
};


Singleton.prototype.get = async function (service, method, args, cb) {
  let ret = await this.app.components[service][method](args)
  cb(ret);
};
