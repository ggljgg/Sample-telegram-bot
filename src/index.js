const TelegramBot = require('node-telegram-bot-api'),
      config = require('./config'),
      DatabaseService = require('./database-service'),
      HtmlGenerator = require('./html-generator'),
      Helper = require('./helper'),
      Keyboard = require('./keyboard-layout'),
      Button = require('./keyboard-button'),
      Action = require('./actions'),
      Film = require('./models/film'),
      Cinema = require('./models/cinema'),
      User = require('./models/user');

const bot = new TelegramBot(config.TOKEN, {polling: true});
DatabaseService.connectDatabase();

bot.on('message', msg => {
    switch(msg.text) {
        case Button.getButton('favourite'):
            Helper.showFavouriteFilms(bot, msg.chat.id, msg.from.id);
            break;
        case Button.getButton('films'):
            bot.sendMessage(msg.chat.id, 'Что тебя интересует? ��������', {
                reply_markup: {
                    keyboard: Keyboard.getKeyboardLayout('films'),
                    resize_keyboard: true
                }
            });
            break;
        case Button.getButton('comedy'):
            Helper.sendFilmsByQuery(bot, msg.chat.id, {type: 'comedy'});
            break;
        case Button.getButton('action'):
            Helper.sendFilmsByQuery(bot, msg.chat.id, {type: 'action'});
            break;
        case Button.getButton('all'):
            Helper.sendFilmsByQuery(bot, msg.chat.id, {});
            break;
        case Button.getButton('cinemas'):
            bot.sendMessage(msg.chat.id, 'Отправь своё местоположение, если хочешь узнать о трёх ближайших к тебе кинотеатрах ��������', {
                reply_markup: {
                    keyboard: Keyboard.getKeyboardLayout('cinema'),
                    resize_keyboard: true
                }
            });
            break;
        case Button.getButton('back'):
            bot.sendMessage(msg.chat.id, 'Выбери команду ��������', {
                reply_markup: {
                    keyboard: Keyboard.getKeyboardLayout('home'),
                    resize_keyboard: true
                }
            });
            break;
    }

    if (msg.location) {
        Helper.getCinemasInCoord(bot, msg.chat.id, msg.location);
    }
});

bot.onText(/\/start/, msg => {
    let text = `Привет, ${msg.from.first_name}!\nРад тебя видеть ���� Я помогу тебе найти ближайшие к тебе кинотеатры и покажу, что в них сейчас показывают. Выбери команду для начала работы со мной ��������`;
    
    bot.sendMessage(msg.chat.id, text, {
        reply_markup: {
            keyboard: Keyboard.getKeyboardLayout('home'),
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
    let filmUuid = Helper.getItemUuid(source);

    Promise.all([
                Film.findOne({uuid: filmUuid}),
                User.findOne({telegramId: msg.from.id})
            ])
            .then(([film, user]) => {
                let isFavourite = false;

                if (user) {
                    isFavourite = user.films.indexOf(film.uuid) !== -1;
                }

                let btnText = isFavourite ? 'Удалить из избранного' : 'Добавить в избранное';

                bot.sendPhoto(msg.chat.id, film.picture, {
                    caption: Helper.generateFilmCaption(film),
                    reply_markup: {
                        inline_keyboard: [
                            [
                                Button.getInlineButton('callback_data',
                                                       btnText,
                                                       JSON.stringify({
                                                               type: Action.TOGGLE_FAV_FILM,
                                                               filmUuid: film.uuid,
                                                               isFavourite: isFavourite
                                                       })),
                                Button.getInlineButton('callback_data',
                                                       'Показать кинотеатры',
                                                       JSON.stringify({
                                                               type: Action.SHOW_CINEMAS,
                                                               cinemaUuids: film.cinemas
                                                       }))
                            ],
                            [
                                Button.getInlineButton('url',
                                                       'Найти на сайте \"КиноПоиск\"',
                                                       film.link)
                            ]
                        ]
                    }
                });
            })
            .catch(error => console.log(error));
});

bot.onText(/\/c(.+)/, (msg, [source, match]) => {
    let cinemaUuid = Helper.getItemUuid(source);

    Cinema.findOne({uuid: cinemaUuid})
          .then(cinema => {
              bot.sendMessage(msg.chat.id, `Кинотетар <b>"${cinema.name}"</b>`, {
                  parse_mode: 'HTML',
                  reply_markup: {
                      inline_keyboard: [
                          [
                              Button.getInlineButton('callback_data',
                                                     'Показать фильмы',
                                                     JSON.stringify({
                                                         type: Action.SHOW_FILMS,
                                                         filmUuids: cinema.films
                                                     })),
                              Button.getInlineButton('callback_data',
                                                     'Показать на карте',
                                                     JSON.stringify({
                                                         type: Action.SHOW_CINEMAS_ON_MAP,
                                                         latitude: cinema.location.latitude,
                                                         longitude: cinema.location.longitude
                                                     })),
                          ],
                          [
                              Button.getInlineButton('url',
                                                     'Перейти на сайт',
                                                     cinema.url)
                          ]
                      ]
                  }
              });
          })
          .catch(error => console.log(error));
});

bot.on('callback_query', query => {
    let data = JSON.parse(query.data);
    let { type, latitude, longitude } = data;
    let inline_keyboard_layout = [];
    
    switch(type) {
        case Action.SHOW_CINEMAS_ON_MAP:
            bot.sendLocation(query.from.id, latitude, longitude);
            break;
        case Action.SHOW_CINEMAS:
            Helper.sendCinemasByQuery(bot, query.from.id, {uuid: {$in: data.cinemaUuids}});
            break;
        case Action.SHOW_FILMS:
            Helper.sendFilmsByQuery(bot, query.from.id, {uuid: {$in: data.filmUuids}})
            break;
        case Action.TOGGLE_FAV_FILM:
            Helper.toggleFavouriteFilm(bot, query.from.id, query.id, data);
            break;
        case Action.NEXT_PAGE:
            Film.paginate(data.query, { limit: 1, page: data.nextPage})
                .then(result => {
                    if(result.docs.length) {
                        let html = result.docs.map(HtmlGenerator.generateFilmHTML)
                                              .join('\n\n');

                        if (result.hasNextPage) {
                            inline_keyboard_layout = [
                                [
                                    Button.getInlineButton('callback_data',
                                                           'Назад',
                                                           JSON.stringify({
                                                               type: Action.PREV_PAGE,
                                                               prevPage: result.prevPage,
                                                               query: data.query
                                                           })),
                                    Button.getInlineButton('callback_data',
                                                           'Далее',
                                                           JSON.stringify({
                                                               type: Action.NEXT_PAGE,
                                                               nextPage: result.nextPage,
                                                               query: data.query
                                                           }))
                                ]
                            ];
                        }
                        else {
                            inline_keyboard_layout = [
                                [
                                    Button.getInlineButton('callback_data',
                                                           'Назад',
                                                           JSON.stringify({
                                                               type: Action.PREV_PAGE,
                                                               prevPage: result.prevPage,
                                                               query: data.query
                                                           }))
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
        case Action.PREV_PAGE:
            Film.paginate(data.query, { limit: 1, page: data.prevPage})
                .then(result => {
                    if(result.docs.length) {
                        let html = result.docs.map(HtmlGenerator.generateFilmHTML)
                                              .join('\n\n');

                        if (result.hasPrevPage) {
                            inline_keyboard_layout = [
                                [
                                    Button.getInlineButton('callback_data',
                                                           'Назад',
                                                           JSON.stringify({
                                                               type: Action.PREV_PAGE,
                                                               prevPage: result.prevPage,
                                                               query: data.query
                                                           })),
                                    Button.getInlineButton('callback_data',
                                                           'Далее',
                                                           JSON.stringify({
                                                               type: Action.NEXT_PAGE,
                                                               nextPage: result.nextPage,
                                                               query: data.query
                                                           }))
                                ]
                            ];
                        }
                        else {
                            inline_keyboard_layout = [
                                [
                                    Button.getInlineButton('callback_data',
                                                           'Далее',
                                                           JSON.stringify({
                                                               type: Action.NEXT_PAGE,
                                                               nextPage: result.nextPage,
                                                               query: data.query
                                                           }))
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
    Film.find({})
        .then(films => {
            let results = films.map(Helper.generateInlineFilm);
            
            bot.answerInlineQuery(query.id, results, {
                cache_time: 0
            });
        });
});

bot.on('polling_error', (error) => console.log(error));