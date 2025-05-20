const {verify} = require("../app/util/verify");

module.exports = function() {
  return new Filter();
}

let Filter = function() {
};

Filter.prototype.before = function (params, session, next) {
  const model = require("../plugins/db");
  try {
    let Log = model("log")
    Log.createRow({params:params,url:'pomelo'})
  }catch (e){



  }
  next();
};

Filter.prototype.after = function (err, msg, session, resp, next) {

  next(err);
};
