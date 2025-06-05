
module.exports = function (app) {
  return new Space(app);
};

let Space = function (app) {
  this.app = app;
  this.channelService = app.get('channelService');
  this.db = app.components['db']
};


Space.prototype.add = async function (userId, serverId, name, cb) {
  const Room = this.db.model("room");
  const User = this.db.model("user");
  console.log('Channel name', name);
  let channel = await this.channelService.getChannel(name, false);
  if (!channel) {
    channel = await this.channelService.getChannel(name, true);
  }
  let user = await User.getRow({user_id: userId})

  if (channel) {

    let uid = await channel.getMember(userId)
    if (!uid) {
      await channel.add(userId, serverId);
    }
    let u = await Room.getRow({user_id: userId, room_name: name})

    if (!u) {
      await Room.createRow({
        user_id: userId, room_name: name
      })
    }
  }
  //let users = await this.get(name, flag)
  let u = await channel.getMember(userId)
  cb(u);

  channel.pushMessage('onAdd', {
    space: name,
    user
  });

};


Space.prototype.addSquare = async function (userId, serverId, name, cb) {
  const Square = this.db.model("square");
  const User = this.db.model("user");
  console.log('Channel name', name);
  let channel = await this.channelService.getChannel(name, true);
  let user = await User.getRow({user_id: userId})

  if (channel) {

    let uid = await channel.getMember(userId)
    if (!uid) {
      await channel.add(userId, serverId);
    }
    let u = await Square.getRow({user_id: userId})
    if (!u) {
      await Square.createRow({
        user_id: userId, room_name: name
      })
    }
  }
  //let users = await this.get(name, flag)
  let u = await channel.getMember(userId)
  cb(u);

  channel.pushMessage('onAdd', {
    space: name,
  });

};


Space.prototype.get = async function (userId, name, cb) {
  let channel = await this.channelService.getChannel(name, true);
  let user = await channel.getMember(userId);
  cb(user)
  return user;

};

/**
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
Space.prototype.kick = async function (userId, serverId,name,session_id,cb) {
  const Room = this.db.model("room");
  const Square = this.db.model("square");
  if (name == "square") {
    await Square.deleteRow({user_id: userId})
  } else {
    await Room.deleteRow({user_id: userId, room_name: name})
  }
  
  let channel = this.channelService.getChannel(name, false);
  // leave channel
  if (!!channel) {
    channel.leave(userId, serverId);
  }
  cb('onLeave')
  channel.pushMessage('onLeave', userId);
};


Space.prototype.pushMessage = async function (userId, route, param, cb) {
  try {
    let channel = this.channelService.getChannel("square", false);
    console.log('channel :',channel);
    let serverId = channel.getMember(userId)['sid'];
    console.log('serverId :',serverId);
    let uids = channel.getMembers();
    console.log('uids :',uids);
    this.channelService.pushMessageByUids(route, param, [{
      uid: userId,
      sid: serverId
    }]);

   // cb(true)
  } catch (e) {
    console.log('Error: ',e)
  //  cb(false)
  }
  
}