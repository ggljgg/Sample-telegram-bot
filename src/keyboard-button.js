module.exports = {
    getHomeButtons() {
        return {
            films: 'Сейчас в кино',
            favourite: 'Избранное',
            cinemas: 'Кинотеатры'
        };
    },

    getFilmButtons() {
        return {
            random: 'Случайный жанр',
            action: 'Боевик',
            comedy: 'Комедия'
        };
    },
    
    getCinemaButton() {
        return {
            text: 'Отправить местоположение',
            request_location: true
        };
    },

    getBackButton() {
        return 'Назад';
    }
}