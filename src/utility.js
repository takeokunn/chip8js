const readline = require('readline');

const print = text_arr => text_arr.forEach(e => console.log(e));

const cursorToBegining = () => readline.cursorTo(process.stdout, 0, 0);

const clearScreen = () => {
    cursorToBegining();
    readline.clearScreenDown(process.stdout);
};

module.exports = { print, clearScreen };
