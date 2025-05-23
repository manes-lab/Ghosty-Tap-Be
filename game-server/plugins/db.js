const appRoot = require('app-root-path');
const glob = require("glob")
const mongoose = require('mongoose');
let util = require('util')

var DbService = function(app, opts) {
  opts = opts || {};
  this.app = app;
  this.models = {}
};

module.exports = function(app, opts) {
  return new DbService(app, opts);
};


DbService.prototype.start = function(cb) {
  let options = this.app.get('options').mongodb
  options['schemas'] = appRoot + '/../models';
  console.log('mongoose :',options);
  mongoose.connect(options.host, function(err){
      if (err) throw err;
      console.log('# mongodb connected.');
    }
  );
  let schemas = options.schemas + (options.schemas.lastIndexOf('/') === (options.schemas.length - 1) ? '' : '/')
  let files = glob.sync(schemas + '/*.js')
  files.map(file => {
    let path = require('path');
    let model = path.basename(file, '.js').toLowerCase();
    let schema = require(file)
    this.models[model] = mongoose.model(model, schema,schema.options.collection)
  });
  process.nextTick(cb);
};

DbService.prototype.afterStart = function (cb) {
  const Square = this.models["square"];
  Square.collection.drop()
  const Room = this.models["room"];
  Room.collection.drop()
  process.nextTick(cb);
}


DbService.prototype.model = function(name) {
  name = name.toLowerCase()
  if (!this.models.hasOwnProperty(name)) {
    throw new Error(util.format('Model not found: %s', name))
  }
  return this.models[name] 
};