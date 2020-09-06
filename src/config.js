const { white, red, green, yellow, blue, magenta, cyan } = require('kleur');

module.exports = {
    rendering_char: '\u2588',
    colors: { white, red, green, yellow, blue, magenta, cyan },
    keys: [
        2,  3,  4,  5,    // | 1 | 2 | 3 | 4 |
        16, 17, 18, 19,   // | Q | W | E | R |
        30, 31, 32, 33,   // | A | S | D | F |
        44, 45, 46, 47    // | Z | X | C | V |
    ],
    time: {
        speed: 450,
        fps_interval: 1000 / 450,
    },
    state: {
        prep: 0,
        loop: 1
    }
};
