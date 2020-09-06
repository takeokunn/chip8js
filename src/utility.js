const readline = require('readline');

const print = text_arr => text_arr.forEach(e => console.log(e));

const printOutput = (cpu_video, rendering_color, rendering_char) => {
    const output = cpu_video.reduce((accum, value, index) => {
        const char = value === 0xFF? rendering_char : ' ';
        const newline = (index + 1) % 64 === 0? '\n' : '';
        return accum + char + newline;
    }, '');
    process.stdout.write(`${rendering_color(output)}\n`);
};

const cursorToBegining = () => readline.cursorTo(process.stdout, 0, 0);

const clearScreen = () => {
    cursorToBegining();
    readline.clearScreenDown(process.stdout);
};

module.exports = { print, printOutput, clearScreen };
