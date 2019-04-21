module.exports = {
    getButton(button) {
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
}