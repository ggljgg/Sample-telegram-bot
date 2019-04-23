const keyboard = require('./keyboard-layout');
const database = require('../database.json');
const mongoose = require('mongoose');
const Film = require('./models/film');
const Cinema = require('./models/cinema');
const User = require('./models/user');
const geolib = require('geolib');
const lodash = require('lodash');

function sendHTML(bot, chatId, html, keyboardLayout=null) {
    let options = {
        parse_mode: 'HTML'
    };
    
    if (keyboardLayout) {
        options['reply_markup'] = {
            keyboard: keyboard.getKeyboardLayout(keyboardLayout),
            resize_keyboard: true   // поставил зашлушку, потому что где-то в процессе кнопки не увеличились
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

    dbConnecting(uri) {
        mongoose.connect(uri, {useNewUrlParser: true})
                 .then(() => console.log('Database is connected...'))
                 .catch((error) => console.log(error));
        
        // database seeder
        // database.films.forEach(f => new Film(f).save().catch(error => console.log(error)));
        // database.cinemas.forEach(c => new Cinema(c).save().catch(error => console.log(error)));
    },

    sendFilmsByQuery(bot, chatId, query) {
        Film.paginate(query, { limit:  1})
            .then(result => {
                
                if(result.docs.length) {
                    let html = result.docs.map(f => {
                        return `Название: <b>"${f.name}"</b>\nРейтинг фильма: <b>${f.rate}</b>\n<i>О фильме:</i> /${f.uuid}`
                    }).join('\n\n');
                    
                    bot.sendMessage(chatId, html, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Далее',
                                        callback_data: JSON.stringify({
                                            type: 'next',
                                            hasNextPage: result.hasNextPage,
                                            nextPage: result.nextPage
                                        })
                                    }
                                ]
                            ]
                        }
                    });
                }
            })
            .catch(error => console.log(error));
    },

    sendCinemasByQuery(bot, userId, query) {
        Cinema.find(query).then(cinemas => {
            let html = cinemas.map((c, i) => {
                return `${i + 1}) Название: <b>"${c.name}"</b>\n    <i>Подробнее =></i> /${c.uuid}`
            }).join('\n');
            
            sendHTML(bot, userId, html, 'home');
        });
    },

    getCinemasInCoord(bot, chatId, location) {
        Cinema.find({}).then(cinemas => {
            cinemas.forEach(c => {
                c.distance = geolib.getDistance(location, c.location) / 1000;
            });
            
            cinemas = lodash.sortBy(cinemas, 'distance');
            topCinemas = cinemas.slice(0, 3);
            
            let html = 'Спасибо за доверие 😊\nВот то, что ты хотел(а) 😉\n\n<b>Ближайшие к тебе 🎥</b>\n\n';
            html += topCinemas.map((c, i) => {
                return `Название: <b>"${c.name}"</b>\n` +
                       `От тебя: ~ <b>${c.distance} км</b>\n` +
                       `<i>О кинотеатре:</i> /${c.uuid}`
            }).join('\n\n');
            
            sendHTML(bot, chatId, html, 'home');
        });
    },

    getItemUuid(source) {
        return source.slice(1);
    },

    showFavouriteFilms(bot, chatId, userId) {
        User.findOne({telegramId: userId}).then(user => {
            if (user && user.films.length !== 0) {
                Film.paginate({uuid: {$in: user.films}})
                    .then(result => {

                        if(result.docs.length) {
                            let html = result.docs.map(f => {
                                return `Название: <b>"${f.name}"</b>\nРейтинг фильма: <b>${f.rate}</b>\n<i>О фильме:</i> /${f.uuid}`
                            }).join('\n\n');
                            
                            bot.sendMessage(chatId, html, {
                                parse_mode: 'HTML'
                            });
                        }
                    })
                    .catch(error => console.log(error));
            } else {
                bot.sendMessage(chatId, 'Прости, но твоя коллекция избранного пуста 😞\n\nНо ты можешь её пополнить, просматривая информаию о конкретном фильме 😎 Для этого просто нажми кнопку \"Добавить в избранное\" и всё будет Окей 😉') 
            }
        }).catch(error => console.log(error));
    },

    toggleFavouriteFilm(bot, userId, queryId, {filmUuid, isFavourite}) {
        User.findOne({telegramId: userId}).then(user => {
            if (user) {
                if(isFavourite) {
                    user.films = user.films.filter(uuid => uuid !== filmUuid);
                } else {
                    user.films.push(filmUuid);
                }
            } else {
                user = new User({
                    telegramId: userId,
                    films: [filmUuid]
                });
            }
            
            let answer = isFavourite ? 'Удалено' : 'Добавлено';
            user.save().then(() => {
                bot.answerCallbackQuery({
                    callback_query_id: queryId,
                    text: answer
                })
            }).catch(error => console.log(error));
        }).catch(error => console.log(error));
    }
};