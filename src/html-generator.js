'use strict';

class HtmlGenerator {
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
}

module.exports = HtmlGenerator;