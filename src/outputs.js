const fs = require('fs');
const minimist = require('minimist');

const config = require('./config');
const utility = require('./utility');

const help = [
    'chip8js: help',

    `\t ${config.colors.yellow('args:')}`,
    `\t\t --help\n`,

    `\t\t --color=<rendering color of ON bits> (optional, default: white)`,
    `\t\t\t available colors: white, red, green, yellow, blue, magenta, cyan\n`,

    `\t\t --speed=<speed of cycle execution, 1000 / speed> (optional, default: ${config.time.speed})\n`,

    `\t\t --rendering_char=<ascii char that represents ON bits> (optional, default: ${config.rendering_char})\n`,

    `\t ${config.colors.yellow('keys:')}`,

    `\t\t controls:`,
    `\t\t [ 1 ] | [ 2 ] | [ 3 ] | [ 4 ]`,
    `\t\t [ Q ] | [ W ] | [ E ] | [ R ]`,
    `\t\t [ A ] | [ S ] | [ D ] | [ F ]`,
    `\t\t [ Z ] | [ X ] | [ C ] | [ V ]`
];

const missing_rom_arg_warning = [
    'chip8js: missing --rom argument \n',

    `\t ${config.colors.yellow('Please specify a correct CHIP8 ROM file path by using --rom argument.')}`,
    `\t\t If you want to see more information you can use the --help argument.`,
    `\t\t ${config.colors.green('chip8js --help')}`,
    ""
];

const speed_arg_warning = [
    'chip8js: --speed argument value must be an integer\n',

    `\t ${config.colors.yellow('Please specify --speed value as an integer.')}`,
    `\t\t If you want to see more information you can use the --help argument.`,
    `\t\t ${config.colors.green('chip8js --help')}`,
    ""
];

const color_arg_warning = [
    'chip8js: invalid color\n',

    `\t ${config.colors.yellow('Please specify a valid and available color name.')}`,
    `\t ${config.colors.yellow('Here is the available colors list: white, red, green, yellow, blue, magenta, cyan')}`,
    `\t\t If you want to see more information you can use the --help argument.`,
    `\t\t ${config.colors.green('chip8js --help')}`,
    ""
];

const rom_path_warning = [
    'chip8js: rom file path warning\n',

    `\t ${config.colors.yellow('ROM file couldn\'t found. Please check the file path.')}`,
    `\t\t If you want to see more information you can use the --help argument.`,
    `\t\t ${config.colors.green('chip8js --help')}`,
    ""
];

const prep_state_text = [
    `chip8js: rom loaded. ${config.colors.green('ready.')}\n`,

    `Press ${config.colors.green('[ENTER]')} to ${config.colors.green('START')} the game.`,
    `When you want to ${config.colors.cyan('RESTART')} the emulation use ${config.colors.cyan('[CTRL] + [R]')}.`,
    'CHIP8 requires 64x32 display so please adjust your terminal size for appropriate rendering before starting the emulation.\n',
    `\t controls:`,
    `\t [ 1 ] | [ 2 ] | [ 3 ] | [ 4 ]`,
    `\t [ Q ] | [ W ] | [ E ] | [ R ]`,
    `\t [ A ] | [ S ] | [ D ] | [ F ]`,
    `\t [ Z ] | [ X ] | [ C ] | [ V ]`
];

const validateArgument = () => {
    const argv = minimist(process.argv.slice(2));

    if (argv.help) {
        utility.print(help);
        process.exit(0);
    }

    const validators = [
        { message: missing_rom_arg_warning, cond: !argv.rom },
        { message: speed_arg_warning,       cond: argv.speed != undefined && !Number.isInteger(argv.speed) },
        { message: color_arg_warning,       cond: argv.color != undefined && Object.keys(config.colors).indexOf(argv.color) < 0 },
        { message: rom_path_warning,        cond: !fs.existsSync(argv.rom) }
    ];
    const errors = validators.reduce((accum, value) => value['cond']? [...accum, ...value['message']] : [...accum], []);

    if (errors.length > 0) {
        utility.print(errors);
        process.exit(1);
    }

    return {
        rom: argv.rom,
        speed: argv.speed,
        color: argv.color
    };
};

module.exports = { validateArgument, prep_state_text };
