'use strict';

const Keyboard = require('./keyboard-layout'),
      Button = require('./keyboard-button'),
      Action = require('./actions'),
      Film = require('./models/film'),
      Cinema = require('./models/cinema'),
      User = require('./models/user'),
      geolib = require('geolib'),
      lodash = require('lodash');

class Helper {
    static generateFilmCaption(film) {
        return `Название: ${film.name}\n` +
               `Год: ${film.year}\n` +
               `Рейтинг: ${film.rate}\n` +
               `Длительность: ${film.length}\n` +
               `Страна: ${film.country}`;
    }
    
    static generateInlineFilm(film) {
        return {
            id: film.uuid,
            type: 'photo',
            photo_url: film.picture,
            thumb_url: film.picture,
            caption: generateFilmCaption(film),
            reply_markup: {
                inline_keyboard: [
                    [
                        Button.getInlineButton('url',
                                               'Найти на сайте \"КиноПоиск\"',
                                               film.link)
                    ]
                ]
            }
        };
    }
    
    static generateFilmHTML(film) {
        return `Название: <b>"${film.name}"</b>\n` +
               `Рейтинг фильма: <b>${film.rate}</b>\n` +
               `<i>О фильме:</i> /${film.uuid}`;
    }
    
    static generateCinemaHTML(cinema) {
        return `Название: <b>"${cinema.name}"</b>\n` +
               `<i>О кинотеатре:</i> /${cinema.uuid}`
    }
    
    static generateCinemaInCoordHTML(cinema) {
        return `Название: <b>"${cinema.name}"</b>\n` +
                `От тебя: ~ <b>${cinema.distance} км</b>\n` +
                `<i>О кинотеатре:</i> /${cinema.uuid}`
    }
    
    static sendHTML(bot, chatId, html, keyboardLayout=null) {
        let options = {
            parse_mode: 'HTML'
        };
        
        if (keyboardLayout) {
            options['reply_markup'] = {
                keyboard: Keyboard.getKeyboardLayout(keyboardLayout),
                resize_keyboard: true
            };
        }
        
        bot.sendMessage(chatId, html, options);
    }
    
    static getItemUuid(source) {
        return source.slice(1);
    }

    static sendFilmsByQuery(bot, chatId, query) {
        Film.paginate(query, { limit:  1})
            .then(result => {
                if(result.docs.length) {
                    let html = result.docs.map(this.generateFilmHTML)
                                          .join('\n\n');
                    
                    bot.sendMessage(chatId, html, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [Button.getInlineButton('callback_data',
                                                        'Далее', 
                                                        JSON.stringify({
                                                            type: Action.ACTION_TYPES.NEXT_PAGE,
                                                            nextPage: result.nextPage,
                                                            query: query     
                                                        }))]
                            ]
                        }
                    });
                }
            })
            .catch(error => console.log(error));
    }

    static sendCinemasByQuery(bot, userId, query) {
        Cinema.find(query)
              .then(cinemas => {
                  let html = cinemas.map(this.generateCinemaHTML)
                                    .join('\n\n');
                  
                  this.sendHTML(bot, userId, html, 'home');
              })
              .catch(error => console.log(error));

    }

    static getCinemasInCoord(bot, chatId, location) {
        Cinema.find({})
              .then(cinemas => {  
                  cinemas.forEach(cinema => {
                      cinema.distance = geolib.getDistance(location, cinema.location) / 1000;
                  });
                  
                  cinemas = lodash.sortBy(cinemas, 'distance');
                  let topCinemas = cinemas.slice(0, 3);
                  
                  let html = 'Спасибо за доверие 😊\nВот то, что ты хотел(а) 😉\n\n<b>Ближайшие к тебе 🎥</b>\n\n';
                  html += topCinemas.map(this.generateCinemaInCoordHTML)
                                    .join('\n\n');
                  
                  this.sendHTML(bot, chatId, html, 'home');
              })
              .catch(error => console.log(error));
    }

    static showFavouriteFilms(bot, chatId, userId) {
        User.findOne({telegramId: userId})
            .then(user => {
                if (user && user.films.length !== 0) {
                    Film.paginate({uuid: {$in: user.films}})
                        .then(result => {
                            if(result.docs.length) {
                                let html = result.docs.map(this.generateFilmHTML)
                                                      .join('\n\n');
                                
                                this.sendHTML(bot, chatId, html);
                            }
                        })
                        .catch(error => console.log(error));
                } else {
                    bot.sendMessage(chatId, 'Прости, но твоя коллекция избранного пуста 😞\n\nНо ты можешь её пополнить, просматривая информаию о конкретном фильме 😎 Для этого просто нажми кнопку \"Добавить в избранное\" и всё будет Окей 😉') 
                }
            })
            .catch(error => console.log(error));
    }

    static toggleFavouriteFilm(bot, userId, queryId, {filmUuid, isFavourite}) {
        User.findOne({telegramId: userId})
            .then(user => {
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
                user.save()
                    .then(() => {
                        bot.answerCallbackQuery({
                            callback_query_id: queryId,
                            text: answer
                        })
                    })
                    .catch(error => console.log(error));
            })
            .catch(error => console.log(error));
    }

    static logInConsole(data) {
        console.log(JSON.stringify(data, null, 4));
    }
}

module.exports = Helper;