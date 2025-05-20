import TelegramBot from "node-telegram-bot-api";
import * as config from "../config.json"
const token = config.TOKEN;

const bot = new TelegramBot(token, {polling: false})

async function main() {
    const resp = await bot.getChat("@infancy_test_channel")

    console.log(resp)
}

main()
