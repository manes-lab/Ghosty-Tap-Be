
module.exports = function (app) {
  return new Handler(app);
};

let Handler = function (app) {
  this.app = app;
};

let handler = Handler.prototype;

handler.leaveSquare = async function (msg, session, next) {
  onUserLeaveSquare(this.app, session)
  next(null, {
    code: '200', success: true, msg: 'ok', data: null
  });
};

handler.enterSquare = async function (msg, session, next) {
  let self = this
  /*  const {verify} = require('../../../util/verify');
  ;
  let dataCheckString = msg.dataCheckString
  if (!dataCheckString) {
    next(null, {
      code: 500, error: true
    });
    return;
  }
  const initData = new URLSearchParams(dataCheckString);
  console.log(' initData: ', initData);
  if (!verify(self.app.get("options").telegram.TOKEN, initData)) {
    next(null, {
      code: 401, error: true
    });
    return;
  }*/

 // let user = JSON.parse(initData.get("user"))
  let userId =msg.user_id
  let sessionService = self.app.get('sessionService');
  
  let duplicatedSession = sessionService.getByUid(userId)
  if (!!duplicatedSession) {
    // onUserLeaveSquare(this.app, duplicatedSession)
    // sessionService.kick(userId)
  }

  session.bind(userId);
  session.set('sid', self.app.get('serverId'))
  session.set('type', 'square');
  session.pushAll()

  session.on('closed', onUserLeaveSquare.bind(null, self.app));

  console.log('room session.id: ', session.id);

  self.app.rpc.space.base.addSquare(session, userId, self.app.get('serverId'), 'square', function (user) {

    console.log(user);
    next(null, {
      code: '200', success: true, msg: 'ok', data: user
    });
  });


};


let onUserLeaveSquare = async function (app, session) {
  if (!session || !session.uid) {
    return;
  }
  console.log('kick user', session.uid);
  app.rpc.space.base.kick(session, session.uid, app.get('serverId'), "square", session.id, function (data) {
    console.log(data);
  });
  app.rpc.space.base.kick(session, session.uid, app.get('serverId'), session.get('type'), session.id, function (data) {
    console.log(data);
  });
};





//================================================  DEBUG ===================================================

handler.robotEnterSquare = async function (msg, session, next) {
  let self = this;

  let userId = msg.userId

  let sessionService = self.app.get('sessionService');
  let duplicatedSession = sessionService.getByUid(userId)
  if (!!duplicatedSession) {
    onUserLeaveSquare(this.app, duplicatedSession)
  }

  session.bind(userId);
  session.set('sid', self.app.get('serverId'))
  session.set('type', 'square');
  session.pushAll()
  console.log('room session.id: ', session.id);

  self.app.rpc.space.base.addSquare(session, userId, self.app.get('serverId'), 'square', function (user) {

    console.log(user);
    next(null, {
      code: '200', success: true, msg: 'ok', data: user
    });
  });


};
