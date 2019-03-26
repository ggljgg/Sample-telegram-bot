const keyboard = require('./keyboard-layout');
const Film = require('./models').Film;
const Cinema = require('./models').Cinema;
const geolib = require('geolib');
const lodash = require('lodash');

function sendHTML(bot, chatId, html, keyboardType=null) {
    let options = {
        parse_mode: 'HTML'
    };
    
    if (keyboardType) {
        options['reply_markup'] = {
            keyboard: keyboard.getKeyboardLayout(keyboardType)
        };
    }
    
    bot.sendMessage(chatId, html, options);
}

module.exports = {
    logStart() {
        console.log('Application was started...');
    },

    logInConsole(data) {
        console.log(JSON.stringify(data, null, 4));
    },

    getFirstName(message) {
        return message.from.first_name;
    },

    getChatId(message) {
        return message.chat.id;
    },

    sendFilmsByQuery(bot, chatId, query) {
        Film.find(query).then(films => {
            let html = films.map((f, i) => {
                return `${i + 1}) Название: <b>"${f.name}"</b>\n    Рейтинг фильма: <b>${f.rate}</b>\n    <i>Подробнее =></i> /${f.uuid}`
            }).join('\n');
    
            sendHTML(bot, chatId, html, 'film');
        });
    },

    getCinemasInCoord(bot, chatId, location) {
        Cinema.find({}).then(cinemas => {
            cinemas.forEach(c => {
                c.distance = geolib.getDistance(location, c.location) / 1000;
            });
            
            cinemas = lodash.sortBy(cinemas, 'distance');
    
            let html = cinemas.map((c, i) => {
                return `${i + 1}) Название: <b>"${c.name}"</b>\n    Расстояние до кинотеатра: <b>${c.distance} км</b>\n    <i>Подробнее =></i> /${c.uuid}`
            }).join('\n');
            
            sendHTML(bot, chatId, html, 'home');
        });
    },

    getItemUuid(source) {
        return source.slice(1);
    },

    sendHTML: sendHTML
};