const kb = require('./keyboard-button');

module.exports = {
    getHomeLayout() {
        return [
            [kb.getHomeButtons().films, kb.getHomeButtons().cinemas],
            [kb.getHomeButtons().favourite]
        ];
    },

    getFilmLayout() {
        return [
            [kb.getFilmButtons().random],
            [kb.getFilmButtons().action, kb.getFilmButtons().comedy],
            [kb.getBackButton()]
        ];
    },

    getCinemaLayout() {
        return [
            [kb.getCinemaButton()],
            [kb.getBackButton()]
        ];
    }
};