const mongoose = require('mongoose');
const film = require('./schemas/film');
const cinema = require('./schemas/cinema');
const user = require('./schemas/user');

const Film = mongoose.model('films', film.filmSchema);
const Cinema = mongoose.model('cinemas', cinema.cinemaSchema);
const User = mongoose.model('users', user.userSchema);

module.exports = {
    Film: Film,
    Cinema: Cinema,
    User: User
};