const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const helper = require('./helper');
const keyboard = require('./keyboard-layout');
const button = require('./keyboard-button');

const Film = require('./models/film');
const Cinema = require('./models/cinema');
const User = require('./models/user');

const ACTION_TYPE = {
    TOGGLE_FAV_FILM: 'tff',
    SHOW_CINEMAS: 'sc',
    SHOW_FILMS: 'sf',
    SHOW_CINEMAS_ON_MAP: 'scom',
    NEXT_PAGE: 'next',
    PREV_PAGE: 'prev'
};
const bot = new TelegramBot(config.TOKEN, {polling: true});

helper.logStart();
helper.dbConnecting(config.DB_URI);


bot.on('message', msg => {
    switch(msg.text) {
        case button.getButton('favourite'):
            helper.showFavouriteFilms(bot, msg.chat.id, msg.from.id);
            break;
        case button.getButton('films'):
            bot.sendMessage(msg.chat.id, 'Что тебя интересует? 😎👇', {
                reply_markup: {
                    keyboard: keyboard.getKeyboardLayout('films'),
                    resize_keyboard: true
                }
            });
            break;
        case button.getButton('comedy'):
            helper.sendFilmsByQuery(bot, msg.chat.id, {type: 'comedy'});
            break;
        case button.getButton('action'):
            helper.sendFilmsByQuery(bot, msg.chat.id, {type: 'action'});
            break;
        case button.getButton('all'):
            helper.sendFilmsByQuery(bot, msg.chat.id, {});
            break;
        case button.getButton('cinemas'):
            bot.sendMessage(msg.chat.id, 'Отправь своё местоположение, если хочешь узнать о трёх ближайших к тебе кинотеатрах 😏👇', {
                reply_markup: {
                    keyboard: keyboard.getKeyboardLayout('cinema'),
                    resize_keyboard: true
                }
            });
            break;
        case button.getButton('back'):
            bot.sendMessage(msg.chat.id, 'Выбери команду 😉👇', {
                reply_markup: {
                    keyboard: keyboard.getKeyboardLayout('home'),
                    resize_keyboard: true
                }
            });
            break;
    }

    if (msg.location) {
        helper.getCinemasInCoord(bot, msg.chat.id, msg.location);
    }
});

bot.onText(/\/start/, msg => {
    let text = `Привет, ${msg.from.first_name}!\nРад тебя видеть 😊 Я помогу тебе найти ближайшие к тебе кинотеатры и покажу, что в них сейчас показывают. Выбери команду для начала работы со мной 😉👇`;
    
    bot.sendMessage(msg.chat.id, text, {
        reply_markup: {
            keyboard: keyboard.getKeyboardLayout('home'),
            resize_keyboard: true
        }
    });
});

bot.onText(/\/about_project/, msg => {
    let text = 'Этот бот задумывался как демо-проект возможностей Bot API платформы Telegram для создания небольших интерактивных геосервисных приложений на данной платформе.\n\nС вопросами и предложениями писать @xXx_777_xXx';
    
    bot.sendMessage(msg.chat.id, text, {
        reply_markup: {
            remove_keyboard: true
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

        bot.sendPhoto(msg.chat.id, film.picture, {
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
                            text: 'Найти на сайте \"КиноПоиск\"',
                            url: film.link
                        }
                    ]
                ]
            }
        });
    });
});

bot.onText(/\/c(.+)/, (msg, [source, match]) => {
    let cinemaUuid = helper.getItemUuid(source);

    Cinema.findOne({uuid: cinemaUuid}).then(cinema => {
        bot.sendMessage(msg.chat.id, `Кинотетар <b>"${cinema.name}"</b>`, {
            parse_mode: 'HTML',
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

    let inline_keyboard_layout = []; // временная переменная, пока не сделаю рефакторинг
    switch(type) {
        case ACTION_TYPE.SHOW_CINEMAS_ON_MAP:
            bot.sendLocation(query.from.id, latitude, longitude);
            break;
        case ACTION_TYPE.SHOW_CINEMAS:
            helper.sendCinemasByQuery(bot, query.from.id, {uuid: {$in: data.cinemaUuids}});
            break;
        case ACTION_TYPE.SHOW_FILMS:
            helper.sendFilmsByQuery(bot, query.from.id, {uuid: {$in: data.filmUuids}})
            break;
        case ACTION_TYPE.TOGGLE_FAV_FILM:
            helper.toggleFavouriteFilm(bot, query.from.id, query.id, data);
            break;
        case ACTION_TYPE.NEXT_PAGE:
            // helper.logInConsole(data);

            Film.paginate({}, { limit: 1, page: data.nextPage})
                .then(result => {
                    // helper.logInConsole(result);

                    if(result.docs.length) {
                        let html = result.docs.map(f => {
                            return `Название: <b>"${f.name}"</b>\nРейтинг фильма: <b>${f.rate}</b>\n<i>О фильме:</i> /${f.uuid}`
                        }).join('\n\n');
                        
                        // helper.logInConsole(html);

                        if (result.hasNextPage) {
                            inline_keyboard_layout = [
                                [
                                    {
                                        text: 'Назад',
                                        callback_data: JSON.stringify({
                                            type: ACTION_TYPE.PREV_PAGE,
                                            // hasPrevPage: result.hasPrevPage,
                                            prevPage: result.prevPage
                                        })
                                    },
                                    {
                                        text: 'Далее',
                                        callback_data: JSON.stringify({
                                            type: ACTION_TYPE.NEXT_PAGE,
                                            // hasNextPage: result.hasNextPage,
                                            nextPage: result.nextPage
                                        })
                                    }
                                ]
                            ];
                        }
                        else {
                            inline_keyboard_layout = [
                                [
                                    {
                                        text: 'Назад',
                                        callback_data: JSON.stringify({
                                            type: ACTION_TYPE.PREV_PAGE,
                                            // hasPrevPage: result.hasPrevPage,
                                            prevPage: result.prevPage
                                        })
                                    }
                                ]
                            ]
                        }

                        bot.editMessageText(html, {
                            parse_mode: 'HTML',
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            reply_markup: { 
                                inline_keyboard: inline_keyboard_layout
                            }
                        });
                    }
                });
            break;
        case ACTION_TYPE.PREV_PAGE:
            // helper.logInConsole(data);
            
            Film.paginate({}, { limit: 1, page: data.prevPage})
                .then(result => {
                    // helper.logInConsole(result);

                    if(result.docs.length) {
                        let html = result.docs.map(f => {
                            return `Название: <b>"${f.name}"</b>\nРейтинг фильма: <b>${f.rate}</b>\n<i>О фильме:</i> /${f.uuid}`
                        }).join('\n\n');
                        
                        // helper.logInConsole(html);

                        if (result.hasPrevPage) {
                            inline_keyboard_layout = [
                                [
                                    {
                                        text: 'Назад',
                                        callback_data: JSON.stringify({
                                            type: ACTION_TYPE.PREV_PAGE,
                                            // hasPrevPage: result.hasPrevPage,
                                            prevPage: result.prevPage
                                        })
                                    },
                                    {
                                        text: 'Далее',
                                        callback_data: JSON.stringify({
                                            type: ACTION_TYPE.NEXT_PAGE,
                                            // hasNextPage: result.hasNextPage,
                                            nextPage: result.nextPage
                                        })
                                    }
                                ]
                            ];
                        }
                        else {
                            inline_keyboard_layout = [
                                [
                                    {
                                        text: 'Далее',
                                        callback_data: JSON.stringify({
                                            type: ACTION_TYPE.NEXT_PAGE,
                                            // hasNextPage: result.hasNextPage,
                                            nextPage: result.nextPage
                                        })
                                    }
                                ]
                            ]
                        }

                        bot.editMessageText(html, {
                            parse_mode: 'HTML',
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            reply_markup: { 
                                inline_keyboard: inline_keyboard_layout
                            }
                        });
                    }
                });
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