const keyboard = require('./keyboard-layout');
const Film = require('./models').Film;
const Cinema = require('./models').Cinema;
const geolib = require('geolib');
const _ = require('lodash');

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
                return f.name
            }).join('\n');
    
            sendHTML(bot, chatId, html, 'film');
        });
    },

    getCinemasInCoord(bot, chatId, location) {
        Cinema.find({}).then(cinemas => {
            cinemas.forEach(c => {
                c.distance = geolib.getDistance(location, c.location) / 1000;
            });
            
            cinemas = _.sortBy(cinemas, 'distance');
    
            let html = cinemas.map((c, i) => {
                return `${c.name} - ${c.distance} км`
            }).join('\n');
            
            sendHTML(bot, chatId, html, 'home');
        });
    }
};