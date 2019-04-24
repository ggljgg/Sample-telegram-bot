'use strict';
class Button {
    static getButton(button) {
        switch(button) {
            case 'films':
                return '🎬 Сейчас в кино';
            case 'favourite':
                return '🌟 Избранное'
            case 'cinemas':
                return '🎥 Кинотеатры';
            case 'all':
                return 'Все жанры';
            case 'action':
                return 'Боевик';
            case 'comedy':
                return 'Комедия';
            case 'location':
                return {
                    text: '🌐 Отправить местоположение',
                    request_location: true
                };
            case 'back':
                return '⬅️ Назад';
        }
    }

    static getInlineButton(button, text, options) {
        switch(button) {
            case 'url':
                return {
                    text: text,
                    url: options
                };
            case 'callback_data':
                return { 
                    text: text,
                    callback_data: options
                };
        }
    }
}

module.exports = Button;