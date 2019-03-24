module.exports = {
    logStart() {
        console.log('Application was started...');
    },

    logInConsole(data) {
        console.log(JSON.stringify(data, null, 4));
    }
};