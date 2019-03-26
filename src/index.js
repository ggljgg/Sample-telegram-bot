const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./helper');
const keyboard = require('./keyboard-layout');
const button = require('./keyboard-button');
const database = require('../database.json');
const Film = require('./models').Film;
const Cinema = require('./models').Cinema;
const User = require('./models').User;

const ACTION_TYPE = {
    TOGGLE_FAV_FILM: 'tff',
    SHOW_CINEMAS: 'sc',
    SHOW_FILMS: 'sf',
    SHOW_CINEMAS_ON_MAP: 'scom'
};

const bot = new TelegramBot(config.TOKEN, {polling: true});

helper.logStart();

mongoose.connect(config.DB_URL, {useNewUrlParser: true})
                 .then(() => console.log('Database is connected...'))
                 .catch((error) => console.log(error));

// database.films.forEach(f => new Film(f).save().catch(error => console.log(error)));
// database.cinemas.forEach(c => new Cinema(c).save().catch(error => console.log(error)));

bot.on('message', msg => {
    switch(msg.text) {
        case button.getButton('favourite'):
            showFavouriteFilms(helper.getChatId(msg), msg.from.id);
            break;
        case button.getButton('films'):
            bot.sendMessage(helper.getChatId(msg), 'Выберите жанр', {
                reply_markup: {
                    keyboard: keyboard.getKeyboardLayout('films')
                }
            });
            break;
        case button.getButton('comedy'):
            helper.sendFilmsByQuery(bot, helper.getChatId(msg), {type: 'comedy'});
            break;
        case button.getButton('action'):
            helper.sendFilmsByQuery(bot, helper.getChatId(msg), {type: 'action'});
            break;
        case button.getButton('random'):
            helper.sendFilmsByQuery(bot, helper.getChatId(msg), {});
            break;
        case button.getButton('cinemas'):
            bot.sendMessage(helper.getChatId(msg), 'Отправьте Ваше местоположение', {
                reply_markup: {
                    keyboard: keyboard.getKeyboardLayout('cinema')
                }
            });
            break;
        case button.getButton('back'):
            bot.sendMessage(helper.getChatId(msg), 'Выберите команду для начала работы', {
                reply_markup: {
                    keyboard: keyboard.getKeyboardLayout('home')
                }
            });
            break;
    }

    if (msg.location) {
        helper.getCinemasInCoord(bot, helper.getChatId(msg), msg.location);
    }
});

bot.onText(/\/start/, msg => {
    let text = `Здравствуйте, ${helper.getFirstName(msg)}!\nВыберите команду для начала работы`;
    bot.sendMessage(helper.getChatId(msg), text, {
        reply_markup: {
            keyboard: keyboard.getKeyboardLayout('home')
        }
    });
});

bot.onText(/\/f(.+)/, (msg, [source, match]) => {
    let filmUuid = helper.getItemUuid(source);

    Promise.all([
        Film.findOne({uuid: filmUuid}),
        User.findOne({telegramId: msg.from.id})
    ]).then(([film, user]) => {
        let isFavourite = false;

        if (user) {
            isFavourite = user.films.indexOf(film.uuid) !== -1;
        }

        let text = isFavourite ? 'Удалить из избранного' : 'Добавить в избранное';
        let caption = `Название: ${film.name}\n` +
                      `Год: ${film.year}\n` +
                      `Рейтинг: ${film.rate}\n` +
                      `Длительность: ${film.length}\n` +
                      `Страна: ${film.country}`;

        bot.sendPhoto(helper.getChatId(msg), film.picture, {
            caption: caption,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: text,
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.TOGGLE_FAV_FILM,
                                filmUuid: film.uuid,
                                isFavourite: isFavourite
                            })
                        },
                        {
                            text: 'Показать кинотеатры',
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.SHOW_CINEMAS,
                                cinemaUuids: film.cinemas
                            })
                        }
                    ],
                    [
                        {
                            text: `Кинопоиск ${film.name}`,
                            url: film.link
                        }
                    ]
                ]
            }
        });
    });

    // Film.findOne({uuid: filmUuid}).then(film => {
        
    // });
});

bot.onText(/\/c(.+)/, (msg, [source, match]) => {
    let cinemaUuid = helper.getItemUuid(source);

    Cinema.findOne({uuid: cinemaUuid}).then(cinema => {
        bot.sendMessage(helper.getChatId(msg), `Кинотетар ${cinema.name}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Показать фильмы',
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.SHOW_FILMS,
                                filmUuids: cinema.films
                            })
                        },
                        {
                            text: 'Показать на карте',
                            callback_data: JSON.stringify({
                                type: ACTION_TYPE.SHOW_CINEMAS_ON_MAP,
                                latitude: cinema.location.latitude,
                                longitude: cinema.location.longitude
                            })
                        }
                    ],
                    [
                        {
                            text: 'Перейти на сайт',
                            url: cinema.url
                        }
                    ]
                ]
            }
        });
    });
});

bot.on('callback_query', query => {
    let data = JSON.parse(query.data);
    let { type, latitude, longitude } = data;


    switch(type) {
        case ACTION_TYPE.SHOW_CINEMAS_ON_MAP:
            bot.sendLocation(query.from.id, latitude, longitude);
            break;
        case ACTION_TYPE.SHOW_CINEMAS:
            sendCinemasByQuery(query.from.id, {uuid: {$in: data.cinemaUuids}});
            break;
        case ACTION_TYPE.SHOW_FILMS:
            helper.sendFilmsByQuery(bot, query.from.id, {uuid: {$in: data.filmUuids}})
            break;
        case ACTION_TYPE.TOGGLE_FAV_FILM:
            toggleFavouriteFilm(query.from.id, query.id, data);
            break;
    }
});

bot.on('inline_query', query => {
    Film.find({}).then(films => {
        let results = films.map(f => {
            let caption = `Название: ${f.name}\n` +
                      `Год: ${f.year}\n` +
                      `Рейтинг: ${f.rate}\n` +
                      `Длительность: ${f.length}\n` +
                      `Страна: ${f.country}`;

            return {
                id: f.uuid,
                type: 'photo',
                photo_url: f.picture,
                thumb_url: f.picture,
                caption: caption,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: `Кинопоиск: ${f.name}`,
                                url: f.link
                            }
                        ]
                    ]
                }
            }
        })
        
        bot.answerInlineQuery(query.id, results, {
            cache_time: 0
        });
    });
});

bot.on('polling_error', (error) => console.log(error));

function toggleFavouriteFilm(userId, queryId, {filmUuid, isFavourite}) {
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

function showFavouriteFilms(chatId, userId) {
    User.findOne({telegramId: userId}).then(user => {
        if (user) {
            Film.find({uuid: {$in: user.films}}).then(films => {
                if(films.length) {
                    let html = films.map((f, i) => {
                        return `${i + 1}) Название: <b>"${f.name}"</b>\n    Рейтинг фильма: <b>${f.rate}</b>\n    <i>Подробнее =></i> /${f.uuid}`
                    }).join('\n');
                    helper.sendHTML(bot, chatId, html, 'home')
                }
            }).catch(error => console.log(error));
        } else {
            bot.sendMessage(chatId, 'Ваша коллекция избранного пуста =(') 
        }
    }).catch(error => console.log(error));
}

function sendCinemasByQuery(userId, query) {
    Cinema.find(query).then(cinemas => {
        let html = cinemas.map((c, i) => {
            return `${i + 1}) Название: <b>"${c.name}"</b>\n    <i>Подробнее =></i> /${c.uuid}`
        }).join('\n');
        
        helper.sendHTML(bot, userId, html, 'home');
    });
}