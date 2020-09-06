const fs = require('fs');
const iohook = require('iohook');

const chip8 = require('./cpu');
const config = require('./config');
const utility = require('./utility');
const outputs = require('./outputs');

// init states
let game_state = config.state.prep;
const initial_time = {
    now: 0,
    elapsed: 0,
    then: Date.now()
};

// parse command line arguments
const args = outputs.validateArgument();
const rom_buffer = fs.readFileSync(args.rom);
const rendering_color = args.color? config.colors[args.color] : config.colors['white'];
const fps_interval = args.speed? 1000 / args.speed : config.time.fps_interval;
const rendering_char = args.rendering_char || config.rendering_char;

// load rom
const cpu = new chip8();
cpu.loadRom(rom_buffer);

utility.clearScreen();
utility.print(outputs.prep_state_text);

// main loops
const handleGameEvent = () => {
    cpu.executeCycle();

    if (!cpu.draw_flag) return;

    utility.clearScreen();

    let output = '';
    for (let i = 0; i < cpu.video.length; i++) {
        output += cpu.video[i] === 0xFF? rendering_char : ' ';
        if ((i + 1) % 64 === 0) output += "\n";
    }
    process.stdout.write(`${rendering_color(output)}\n`);

    cpu.draw_flag = false;
};

const mainLoop = time => {
    const cond = time.elapsed > fps_interval;
    const now = Date.now();
    const new_time = {
        now: now,
        elapsed: now - time.then,
        then: cond? now - (time.elapsed % fps_interval) : time.then
    };

    if (cond) handleGameEvent();
    if (game_state === config.state.loop) setImmediate(mainLoop.bind(this, new_time));
};

// keyboard events
// const handleKeyup = e => {
//     for (let i = 0, len = config.keys.length; i < len; i++) {
//         if (e.keycode === config.keys[i]) {
//             cpu.keypad[i] = 0;
//             break;
//         }
//     }
// };

const handleKeydown = e => {
    if (e.keycode === 19 && e.ctrlKey && game_state === config.state.prep) {
        game_state = config.state.prep;
        cpu.reset();
        utility.clearScreen();
        game_state = config.state.loop;
        mainLoop(initial_time);
    }

    if (e.keycode === 28 && game_state === config.state.prep) {
        game_state = config.state.loop;
        utility.clearScreen();
        mainLoop(initial_time);
    }

    // for (let i = 0, len = config.keys.length; i < len; i++) {
    //     if (e.keycode == config.keys[i]) {
    //         cpu.keypad[i] = 1;
    //         break;
    //     }
    // }
};

// iohook.on('keyup', handleKeyup);
iohook.on('keydown', handleKeydown);
iohook.start();
