const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const helper = require('./helper');
const keyboard = require('./keyboard-layout');
const button = require('./keyboard-button');

const bot = new TelegramBot(config.TOKEN, {polling: true});

bot.on('message', msg => {
    // helper.logInConsole(msg);

    switch(msg.text) {
        case button.getHomeButtons().favourite:
            break;
        
        case button.getHomeButtons().films:
            bot.sendMessage(helper.getChatId(msg), 'Выберите жанр:', {
                reply_markup: {
                    keyboard: keyboard.getFilmLayout()
                }
            });
            break;
        
        case button.getHomeButtons().cinemas:
            break;
        
        case button.getBackButton():
            bot.sendMessage(helper.getChatId(msg), 'Выберите команду для начала работы:', {
                reply_markup: {
                    keyboard: keyboard.getHomeLayout()
                }
            });
            break;
    }
});

bot.onText(/\/start/, msg => {
    let text = `Здравствуйте, ${helper.getFirstName(msg)}!\nВыберите команду для начала работы:`;
    bot.sendMessage(helper.getChatId(msg), text, {
        reply_markup: {
            keyboard: keyboard.getHomeLayout()
        }
    });
});

bot.on("polling_error", (err) => console.log(err));

helper.logStart();