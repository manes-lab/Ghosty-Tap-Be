const moment = require('moment');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// JWT Secret - 在生产环境中应该使用环境变量
const JWT_SECRET = 'your-secret-key';

function auth(apiToken, initData) {
    const data = initData
    data.sort();
    const hash = data.get("hash");
    data.delete("hash");

    const dataToCheck = [...data.entries()].map(([key, value]) => key + "=" + value).join("\n");
    {
        const secretKey = crypto.createHmac("sha256", "WebAppData").update(apiToken).digest();
        const gHash = crypto.createHmac("sha256", secretKey).update(dataToCheck).digest("hex");
        if (hash === gHash) {
            return true
        }
    }
    return false;
}

/**
 * 解析和验证 JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - 解析后的 payload 或 null
 */
function parseAndVerifyToken(token) {
    try {
        if (!token) {
            console.log('Token 为空');
            return null;
        }

        // 验证并解析 token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token 解析成功:', decoded);
        
        return decoded;
    } catch (error) {
        console.log('Token 验证失败:', error.message);
        return null;
    }
}

/**
 * 校验 token 时间是否有效
 * @param {object} payload - JWT payload
 * @param {number} maxAgeInHours - 最大允许的时间差（小时）
 * @returns {object} - 校验结果
 */
function validateTokenTime(payload, maxAgeInHours = 365 * 24) { // 365天 = 365 * 24小时
    try {
        const currentTime = Date.now();
        const tokenTime = payload.timestamp;
        
        if (!tokenTime) {
            return {
                valid: false,
                reason: 'Token 中缺少时间戳'
            };
        }

        // 计算时间差（毫秒）
        const timeDiff = currentTime - tokenTime;
        const maxAgeInMs = maxAgeInHours * 60 * 60 * 1000;

        console.log(`当前时间: ${moment(currentTime).format('YYYY-MM-DD HH:mm:ss')}`);
        console.log(`Token 时间: ${moment(tokenTime).format('YYYY-MM-DD HH:mm:ss')}`);
        console.log(`时间差: ${Math.floor(timeDiff / 1000 / 60 / 60)} 小时 (${Math.floor(timeDiff / 1000 / 60 / 60 / 24)} 天)`);

        if (timeDiff < 0) {
            return {
                valid: false,
                reason: 'Token 时间不能是未来时间'
            };
        }

        if (timeDiff > maxAgeInMs) {
            return {
                valid: false,
                reason: `Token 已过期，超过 ${Math.floor(maxAgeInHours / 24)} 天限制`
            };
        }

        return {
            valid: true,
            timeDiff: timeDiff,
            age: Math.floor(timeDiff / 1000 / 60), // 返回分钟数
            ageHours: Math.floor(timeDiff / 1000 / 60 / 60), // 返回小时数
            ageDays: Math.floor(timeDiff / 1000 / 60 / 60 / 24) // 返回天数
        };
    } catch (error) {
        return {
            valid: false,
            reason: `时间校验错误: ${error.message}`
        };
    }
}

/**
 * 完整的 token 验证（包括解析和时间校验）
 * @param {string} token - JWT token
 * @param {number} maxAgeInHours - 最大允许的时间差（小时）
 * @returns {object} - 验证结果
 */
function verifyTokenComplete(token, maxAgeInHours = 365 * 24) { // 365天 = 365 * 24小时
    // 1. 解析 token
    const payload = parseAndVerifyToken(token);
    if (!payload) {
        return {
            valid: false,
            reason: 'Token 解析失败',
            payload: null
        };
    }

    // 2. 校验时间
    const timeValidation = validateTokenTime(payload, maxAgeInHours);
    if (!timeValidation.valid) {
        return {
            valid: false,
            reason: timeValidation.reason,
            payload: payload
        };
    }

    return {
        valid: true,
        payload: payload,
        timeInfo: timeValidation
    };
}

const verify = async (ctx, next) => {
    let fgYellow = "\x1b[33m%s\x1b[0m";
    let fgBlue = "\x1b[34m%s\x1b[0m";
    let fgGreen = "\x1b[32m%s\x1b[0m";
    let fgRed = "\x1b[31m%s\x1b[0m";

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
        '/api/v1/squares/urlInvitationForBattle',

        '/api/v1/user/claimCoins',
        '/api/v1/game/zen/asyncSubmitGameData'
    ]
    let whiteList = [
        '/api/v1/user/registerOrLogin',
    ]
    
    let manager = [
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
    
    console.log(fgYellow, "request url:" + "  " + method + "  " + url);
    console.log(fgBlue, "request params :" + JSON.stringify(params));
    
    try {
        let Log = ctx.model("log")
        await Log.createRow({params: params, url: url})
    } catch (e) {
    }

    if (url.indexOf('/api/v1/') == -1 && url.indexOf('/api/v2/') == -1) {
        console.log("method_name")
        ctx.throw(401, 'method name error');
    }
    
    try {
        if (method == "POST" && allow.indexOf(url) != -1) {
            const dataCheckString = params.data_check_string
            const appId = params.app_id
            const user_id = ctx.req.headers['user-id'] ? ctx.req.headers['user-id'] : ctx.req.headers.user_id
            const token = ctx.req.headers.token
            
            console.log(fgYellow, "Headers:", ctx.req.headers);

            // Token 验证逻辑
            if (token) {
                console.log(fgBlue, "开始验证 Token...");
            
                // 完整验证 token（解析 + 时间校验）
                const tokenValidation = verifyTokenComplete(token, 365 * 24); // 365天有效期
                
                if (!tokenValidation.valid) {
                    console.log(fgRed, `Token 验证失败: ${tokenValidation.reason}`);
                    
                    // 根据需要决定是否直接拒绝请求
                     ctx.throw(401, tokenValidation.reason);
                    
                    // 或者只是记录警告，允许请求继续
                    console.log(fgRed, "Token 验证失败，但允许请求继续");
                  
                } else {
                    console.log(fgGreen, "Token 验证成功!");
                    console.log(fgGreen, `Token 年龄: ${tokenValidation.timeInfo.ageDays} 天 ${tokenValidation.timeInfo.ageHours % 24} 小时`);
                    console.log(fgGreen, `用户地址: ${tokenValidation.payload.address}`);
                    
                    // 将解析后的信息添加到 params 中
                    params.verified_address = tokenValidation.payload.address;
                    params.token_timestamp = tokenValidation.payload.timestamp;
                    params.token_age_minutes = tokenValidation.timeInfo.age;
                    params.token_age_days = tokenValidation.timeInfo.ageDays;
                    params.user_id = tokenValidation.payload.address;
                }
            } else {
                ctx.throw(401, 'token is error');
                console.log(fgRed, "请求中没有找到 Token");
            }
            ctx.params = {
                ...params,
                user_id: user_id,
                token: token
            }
            
            console.log(fgGreen, "params :" + JSON.stringify(ctx.params));

        } else if (method == "GET") {
            // GET 请求处理逻辑

        } else if (manager.indexOf(url) != -1) {
            // 管理员接口处理逻辑

        } else if (whiteList.indexOf(url) != -1) {
            // 白名单接口处理逻辑
            ctx.params = {
                ...params,
                user_id: user_id,
                token: token
            }
            console.log(fgGreen, "params :" + JSON.stringify(ctx.params));
        } else {
            ctx.throw(401, 'url is error');
        }
    } catch (e) {
        console.log(e)
        ctx.throw(401, e);
    }

    await next();
};

module.exports = verify
