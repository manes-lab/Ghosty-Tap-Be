const TelegramBot = require("node-telegram-bot-api")
const config = require("config")
// replace the value below with the Telegram token you receive from @BotFather
const token = config.telegram.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: false});

module.exports = bot