const kb = require('./keyboard-button');

module.exports = {
    getKeyboardLayout(keyboardType) {  
        switch(keyboardType) {
            case 'home':
                return [
                    [kb.getButton('films'), kb.getButton('cinemas')],
                    [kb.getButton('favourite')]
                ];
            case 'films':
                return [
                    [kb.getButton('random')],
                    [kb.getButton('action'), kb.getButton('comedy')],
                    [kb.getButton('back')]
                ];
            case 'cinema':
                return [
                    [kb.getButton('location')],
                    [kb.getButton('back')]
                ];
        }
    }
};