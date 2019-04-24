const config = require('./config'),
      database = require('../database.json'),
      mongoose = require('mongoose'),
      Film = require('./models/film'),
      Cinema = require('./models/cinema');

function connectDatabase(uri=config.DB_URI) {
    mongoose.connect(uri, {useNewUrlParser: true})
            .then(() => console.log('Соединение с базой данных успешно установлено.'))
            .catch((error) => console.log(error));
}

function seedDatabase() {
    console.log('Инициализация тестовыми данными пройдена успешно.')

    database.films.forEach(f => new Film(f).save()
                                           .catch(error => console.log(error)));

    database.cinemas.forEach(c => new Cinema(c).save()
                                               .catch(error => console.log(error)));
}

mongoose.connection.on('connected', () => {
    mongoose.connection.db.listCollections().toArray(function (error, collections) {
        let isCinemasCollection = false;
        let isFilmsCollection = false;

        collections.forEach(element => {
            isCinemasCollection = element['name'] === 'cinemas' ? true : isCinemasCollection;
            isFilmsCollection = element['name'] === 'films' ? true : isFilmsCollection;
        });

        if ((isCinemasCollection && isFilmsCollection) === false) {
            seedDatabase();
        }
    });
})
module.exports = {
    connectDatabase: connectDatabase
}