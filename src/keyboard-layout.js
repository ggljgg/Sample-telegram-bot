const Button = require('./keyboard-button');

module.exports = {
    getKeyboardLayout(keyboardType) {  
        switch(keyboardType) {
            case 'home':
                return [
                    [Button.getButton('films'), Button.getButton('cinemas')],
                    [Button.getButton('favourite')]
                ];
            case 'films':
                return [
                    [Button.getButton('all')],
                    [Button.getButton('action'), Button.getButton('comedy')],
                    [Button.getButton('back')]
                ];
            case 'cinema':
                return [
                    [Button.getButton('location')],
                    [Button.getButton('back')]
                ];
        }
    }
};