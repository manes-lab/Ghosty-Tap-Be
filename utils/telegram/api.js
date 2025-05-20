const config = require("config")
const bot = require("./bot")

async function checkMember(chatId, userId,type) {
    let join = false
  if (type=='follow'){
    try {
      //console.log(chatId);
      //   join = !(await bot.getChatMember(chatId, userId))
      let  info = await bot.getChatMember(chatId, userId)
      console.log(info);
      if (info){
        if (info.status!='left'){
          join=true
        }
      }

    } catch (e) {
      //console.log(e);
    }
    return join
  }else {
    try {
     // console.log(chatId);
      //   join = !(await bot.getChatMember(chatId, userId))
      let  info = await bot.getChatMember(chatId, userId)
     console.log(info);
      if (info){
        if (info.is_member||info.status=='creator'||info.status=='member'||info.status=='administrator'){
          join=true
        }
      }

    } catch (e) {
     // console.log(e);
    }
    return join
  }
}

module.exports = {
    checkMember
}
