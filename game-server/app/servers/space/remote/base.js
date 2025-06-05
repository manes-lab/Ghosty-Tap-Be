
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


Space.prototype.pushMessage = async function (serverId,userId, route, param, cb) {
  try {
    // 获取频道，如果不存在则创建
    let channel = this.channelService.getChannel("square", true);
    
    if (!channel) {
      console.log('Failed to get or create channel: square');
      cb(null, { code: 500, msg: 'Channel error' });
      return;
    }
    
    let uids = channel.getMembers();
    console.log('Channel members:', uids);
    console.log('Target userId:', userId);
    
    // 检查目标用户是否在频道中
    if (!uids || uids.indexOf(userId) === -1) {
      console.log('User not in channel, adding user to channel');
      // 如果用户不在频道中，可以选择添加用户到频道
      // channel.add(userId, serverId);
    }

    // 使用pushMessageByUids推送给特定用户
    this.channelService.pushMessageByUids(route, param, [{
      uid: userId,
      sid:serverId
    }], {},(err) => {
      if (err) {
        console.log('Push message error:', err);
        cb(null, { code: 500, msg: 'Push message failed', error: err.toString() });
      } else {
        console.log('Message sent successfully to user:', userId);
        cb(null, { code: 200, msg: 'Message sent successfully' });
      }
    });
    
  } catch (e) {
    console.log('Exception in push message:', e);
    console.log('Stack trace:', e.stack);
    cb(null, { code: 500, msg: 'Server error', error: e.toString() });
  }
  
}