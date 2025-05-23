
const moment = require('moment');
const crypto = require('crypto');

function auth ( apiToken, initData ) {
  const data = initData
  data.sort();
  const hash = data.get( "hash" );
  data.delete( "hash" );

  const dataToCheck = [...data.entries()].map( ( [key, value] ) => key + "=" + value ).join( "\n" );
  {
    const secretKey = crypto.createHmac( "sha256", "WebAppData" ).update( apiToken ).digest();
    const gHash = crypto.createHmac( "sha256", secretKey ).update( dataToCheck ).digest( "hex" );
    if (hash === gHash){
      return true
    }
  }
  return false;
}

const verify = async (ctx, next) => {
  let fgYellow = "\x1b[33m%s\x1b[0m";
  let fgBlue = "\x1b[34m%s\x1b[0m";
  let fgGreen = "\x1b[32m%s\x1b[0m";

  let allow = [
    '/api/v1/user/test',
    '/api/v1/user/register',
    '/api/v1/activity/createActivity',
    '/api/v1/activity/invitation',
    '/api/v1/examination/commitOneQuestions',
    '/api/v1/examination/commitQuestions',
    '/api/v1/user/help/addHp',
    '/api/v1/examination/createExamination',
    '/api/v1/user/status',
    '/api/v1/activity/createActivity',
    '/api/v1/activity/invitation',
    '/api/v1/activity/invitation/addPower',
    '/api/v1/activity/invitation/chillDown',
    '/api/v1/activity/invitation/addPowerCount',
    '/api/v1/activity/OpenBoxes',
    '/api/v1/settlement/withdraw',
    '/api/v1/game/adventure/createGame',
    '/api/v1/game/adventure/submitGameData',
    '/api/v1/game/zen/submitGameData',
    '/api/v1/invitation/invite',
    '/api/v1/battle/leaveGame',
    '/api/v1/squares/invitationForBattle',
    '/api/v1/squares/dealInvitationForBattle',
    '/api/v1/setting/setNotice',
    '/api/v1/squares/setBlock',
    '/api/v1/user/register',
    '/api/v1/squares/urlInvitationForBattle'

  ]
  let manager =[
    '/api/v1/manager/admin/login',
    '/api/v1/manager/admin/register',
    '/api/v1/settlement/withdrawHistoryReview',
    '/api/v1/settlement/rewardHistoryReview',
    '/api/v1/settlement/withdrawCompleted',
    '/api/v1/settlement/withdrawRefuse',
    '/api/v1/question/add/limitQuestion',
    '/api/v1/question/add/deleteLimitQuestion',
    '/api/v1/question/add/updateLimitQuestion',
    '/api/v1/question/add/cooperateQuestion',
    '/api/v1/question/add/deleteCooperateQuestion',
    '/api/v1/question/add/updateCooperateQuestion',
    '/api/v1/question/add/createAnswerActivity',
    '/api/v1/question/add/updateAnswerActivity'


  ]

  let params = ctx.params
  let url = ctx.request.url
  let method = ctx.request.method
  //let headers = ctx.request.headers
  //console.log(headers);
  console.log(fgYellow, "request url:" + "  " + method + "  " + url);
  console.log(fgBlue, "request params :" + JSON.stringify(params));
  try {
    let Log = ctx.model("log")
    await Log.createRow({params:params,url:url})
  }catch (e) {
  }

  if (url.indexOf('/api/v1/') == -1&&url.indexOf('/api/v2/') == -1) {
    console.log("method_name")
    ctx.throw(401, 'method name error');
  }
  try {
    if (method == "POST" && allow.indexOf(url) != -1) {

   const dataCheckString = params.data_check_string
      const appId = params.app_id
      //let token = config.telegram.OTHER_TOKEN[appId]
      const user_id = ctx.req.headers.user_id
      const token = ctx.req.headers.token
      console.log("\x1b[33m%s\x1b[0m",ctx.req.headers);
      /*    if (!token) {
            token = config.telegram.TOKEN
          }*/

      // const initData = new URLSearchParams( dataCheckString );
      // let user = initData.get( "user" )
      /*      if (!auth(token, new URLSearchParams( dataCheckString ))) {
           if (!auth(config.telegram.TOKEN, new URLSearchParams( dataCheckString ))) {
             ctx.throw(401, 'now allowed');
           }
         }*/

      // const timestamp = initData.get('auth_date')
      // user=JSON.parse(user)
      // console.log(user);
      ctx.params = {
         appId: params.app_id,
        ...params.args,
        user_id:user_id
      }
      console.log(fgGreen, "params :" + JSON.stringify(ctx.params));

    } else if(method == "GET"){

    }else if(manager.indexOf(url) != -1){

    }else {
      ctx.throw(401, 'url is error');

    }
  } catch (e) {
    console.log(e)
    ctx.throw(401, e);
  }


  await next();
};


module.exports = verify
