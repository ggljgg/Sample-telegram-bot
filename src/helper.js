module.exports = {
    logStart() {
        console.log('Application was started...');
    },

    logInConsole(data) {
        console.log(JSON.stringify(data, null, 4));
    },

    getFirstName(message) {
        return message.from.first_name;
    },

    getChatId(message) {
        return message.chat.id;
    }
};