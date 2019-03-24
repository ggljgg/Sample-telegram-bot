const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const filmSchema = new Schema({
    uuid: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    rate: {
        type: Number
    },
    length: {
        type: String
    },
    country: {
        type: String
    },
    link: {
        type: String
    },
    picture: {
        type: String
    },
    cinemas: {
        type: [String],
        default: []
    }
});

module.exports = {
    filmSchema: filmSchema
};