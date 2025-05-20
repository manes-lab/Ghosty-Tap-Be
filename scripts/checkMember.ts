import TelegramBot from "node-telegram-bot-api";
import * as config from "../config.json"
const token = config.TOKEN;

const bot = new TelegramBot(token, {polling: false})

const list = [
    6892280766
]

async function main() {
    for (let userId of list) {
        try {
            const res = await bot.getChatMember(config.CHAT_ID, userId)
            console.log(`${userId} : ${res.user.first_name}`)
        } catch (e) {
            console.log("user not found")
            continue
            
        }
    }
}

main()
