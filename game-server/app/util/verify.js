const crypto = require("crypto");
const JWT_SECRET = 'yydd-ccbbet-det';
const jwt = require('jsonwebtoken');
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

/*
    // 2. 校验时间
    const timeValidation = validateTokenTime(payload, maxAgeInHours);
    if (!timeValidation.valid) {
        return {
            valid: false,
            reason: timeValidation.reason,
            payload: payload
        };
    }
*/

    return {
        valid: true,
        payload: payload,
       // timeInfo: timeValidation
    };
}


function verify(token) {
    let fgGreen = "\x1b[32m%s\x1b[0m";
    const tokenValidation = verifyTokenComplete(token, 365 * 24); // 365天有效期

    if (!tokenValidation.valid) {
       return  false

    } else {
        console.log(fgGreen, "Token 验证成功!");
       // console.log(fgGreen, `Token 年龄: ${tokenValidation.timeInfo.ageDays} 天 ${tokenValidation.timeInfo.ageHours % 24} 小时`);
        console.log(fgGreen, `用户地址: ${tokenValidation.payload.address}`);

        return tokenValidation.payload.address;
        // 将解析后的信息添加到 params 中
        /*params.verified_address = tokenValidation.payload.address;
        params.token_timestamp = tokenValidation.payload.timestamp;
        params.token_age_minutes = tokenValidation.timeInfo.age;
        params.token_age_days = tokenValidation.timeInfo.ageDays;
        params.user_id = tokenValidation.payload.address;*/
    }

}

module.exports = {
  verify
}
