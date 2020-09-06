class Chip8 {
    constructor() {
        this.width = 64;
        this.height = 32;

        this.font_set_start_address = 0x50;
        this.program_counter_start_address = 0x200;

        this.font_set = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        this.reset();
        this.resetMemory();
    }

    reset() {
        this.registers = new Uint8Array(16);
        this.video = new Uint8Array(this.width * this.height);
        this.keypad = new Uint8Array(16);

        this.stack = new Uint16Array(16);
        this.stack_pointer = 0;

        this.delay_timer = 0;

        this.opcode = 0;
        this.index = 0;
        this.program_counter = this.program_counter_start_address;

        this.draw_flag = false;
    }

    resetMemory() {
        this.memory = new Uint8Array(4096);

        for (let i = 0; i < this.font_set.length; i++) {
            this.memory[i + this.font_set_start_address] = this.font_set[i];
        }
    }

    loadRom(rom_buffer) {
        for (let i = 0; i < rom_buffer.length; i++) {
            this.memory[i + this.program_counter_start_address] = rom_buffer[i];
        }
    }

    executeCycle() {
        this.opcode = this.memory[this.program_counter] << 8 | this.memory[this.program_counter + 1];
        this.program_counter += 2;

        this.dispatchInstruction();

        if (this.delay_timer > 0) this.delay_timer--;
    }

    dispatchInstruction() {
        switch (this.opcode & 0xF000) {
        case 0x0000:
            {
                switch(this.opcode & 0x000F) {
                case 0x0000: this.op_00e0(); break;
                case 0x000E: this.op_00ee(); break;
                default: this.op_error("0x0000"); break;
                }
            }
            break;
        case 0x1000: this.op_1nnn(); break;
        case 0x2000: this.op_2nnn(); break;
        case 0x3000: this.op_3xnn(); break;
        case 0x4000: this.op_4xnn(); break;
        case 0x5000: this.op_5xy0(); break;
        case 0x6000: this.op_6xnn(); break;
        case 0x7000: this.op_7xnn(); break;
        case 0x8000:
            {
                switch (this.opcode & 0x000F) {
                case 0x0000: this.op_8xy0(); break;
                case 0x0001: this.op_8xy1(); break;
                case 0x0002: this.op_8xy2(); break;
                case 0x0003: this.op_8xy3(); break;
                case 0x0004: this.op_9xy4(); break;
                case 0x0005: this.op_8xy5(); break;
                case 0x0006: this.op_8xy6(); break;
                case 0x0007: this.op_8xy7(); break;
                case 0x000E: this.op_8xye(); break;
                default: this.op_error("0x8000"); break;
                }
            }
            break;
        case 0x9000: this.op_9xy0(); break;
        case 0xA000: this.op_annn(); break;
        case 0xB000: this.op_bnnn(); break;
        case 0xC000: this.op_cxnn(); break;
        case 0xD000: this.op_dxyn(); break;
        case 0xE000:
            {
                switch (this.opcode & 0x000F) {
                case 0x000E: this.op_ex9e(); break;
                case 0x0001: this.op_exa1(); break;
                default: this.op_error("0xE000"); break;
                }
            }
            break;
        case 0xF000:
            {
                switch (this.opcode & 0x000F) {
                case 0x0007: this.op_fx07(); break;
                case 0x000A: this.op_fx0a(); break;
                case 0x0005:
                    {
                        switch(this.opcode & 0x00F0) {
                        case 0x0010: this.op_fx15(); break;
                        case 0x0050: this.op_fx55(); break;
                        case 0x0060: this.op_fx65(); break;
                        default: this.op_error("0xF000 > 0x0060"); break;
                        }
                    }
                    break;
                case 0x0008: break;
                case 0x000E: this.op_fx1e(); break;
                case 0x0009: this.op_fx29();break;
                case 0x0003: this.op_fx33(); break;
                default: this.op_error("0xF000"); break;
                }
            }
            break;
        default: this.op_error("error"); break;
        }
    }

    // ERROR: display error
    op_error(cnd) {
        console.log(`[${cnd}]: 0x${this.opcode.toString(16)} undefined opcode`);
    }

    // 00E0: clear the display
    op_00e0() {
        let i = 0;
        while (i < this.video.length) this.video[i++] = 0;
        this.draw_flag = true;
    }

    // 00EE: Returns from a subroutine.
    op_00ee() {
        this.program_counter = this.stack[--this.stack_pointer];
    }

    // 1NNN: Jumps to address NNN.
    op_1nnn() {
        this.program_counter = this.opcode & 0x0FFF;
    }

    // 2NNN: Calls subroutine at NNN.
    op_2nnn() {
        this.stack[this.stack_pointer++] = this.program_counter;
        this.program_counter = this.opcode & 0xFFF;
    }

    // 3XNN: Skips the next instruction if VX equals NN.
    op_3xnn() {
        const register = (this.opcode & 0x0F00) >> 8;
        const value = this.opcode & 0x00FF;
        if (this.registers[register] === value) this.program_counter += 2;
    }

    // 4XNN: Skips the next instruction if VX doesn't equal NN.
    op_4xnn() {
        const register = (this.opcode & 0x0F00) >> 8;
        const value = this.opcode & 0x00FF;
        if (this.registers[register] !== value) this.program_counter += 2;
    }

    // 5XY0: Skips the next instruction if VX equals VY.
    op_5xy0() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        if (this.registers[rx] === this.registers[ry]) this.program_counter += 2;
    }

    // 6XNN: Sets VX to NN.
    op_6xnn() {
        const register = (this.opcode & 0x0F00) >> 8;
        const value = this.opcode & 0x00FF;
        this.registers[register] = value;
    }

    // 7XNN: Adds NN to VX.
    op_7xnn() {
        const register = (this.opcode & 0x0F00) >> 8;
        const value = this.opcode & 0x00FF;
        this.registers[register] += value;
    }

    // 8XY0: Sets VX to the value of VY.
    op_8xy0() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        this.registers[rx] = this.registers[ry];
    }

    // 8XY1: Sets VX to VX or VY.
    op_8xy1() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        this.registers[rx] |= this.registers[ry];
    }

    // 8XY2: Sets VX to VX and VY.
    op_8xy2() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        this.registers[rx] &= this.registers[ry];
    }

    // 8XY3: Sets VX to VX xor VY.
    op_8xy3() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        this.registers[rx] ^= this.registers[ry];
    }

    // 8XY4: Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
    op_9xy4() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        const sum = this.registers[rx] + this.registers[ry];

        this.registers[15] = sum > 255? 1 : 0;
        this.registers[rx] = sum & 0xFF;
    }

    // 8XY5: VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
    op_8xy5() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        this.registers[15] = this.registers[rx] > this.registers[ry]? 1 : 0;
        this.registers[rx] -= this.registers[ry];
    }

    // 8XY6: Stores the least significant bit of VX in VF and then shifts VX to the right by 1.
    op_8xy6() {
        const register = (this.opcode & 0x0F00) >> 8;
        this.registers[15] = this.registers[register] & 0x01;
        this.registers[register] >>= 1;
    }

    // 8XY7: Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
    op_8xy7() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        this.registers[15] = this.registers[ry] > this.registers[rx]? 1 : 0;
        this.registers[rx] = this.registers[ry] - this.registers[rx];
    }

    // 8XYE: Stores the most significant bit of VX in VF and then shifts VX to the left by 1.
    op_8xye() {
        const register = (this.opcode & 0x0F00) >> 8;
        this.registers[15] = (this.registers[register] & 0x80) >> 7;
        this.registers[register] <<= 1;
    }

    // 9XY0: Skips the next instruction if VX doesn't equal VY.
    op_9xy0() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        if (this.registers[rx] != this.registers[ry]) this.program_counter += 2;
    }

    // ANNN: Sets I to the address NNN.
    op_annn() {
        this.index = this.opcode & 0x0FFF;
    }

    // BNNN: Jumps to the address NNN plus V0.
    op_bnnn() {
        this.program_counter = (this.opcode & 0x0FFF) + this.registers[0];
    }

    // CXNN: Sets VX to the result of a bitwise and operation on a random number (Typically: 0 to 255) and NN.
    op_cxnn() {
        const register = (this.opcode & 0x0F00) >> 8;
        const value = this.opcode & 0x00FF;
        this.registers[register] = Math.floor(Math.random() * 256) & value;
    }

    // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
    // Each row of 8 pixels is read as bit-coded starting from memory location I;
    // I value doesn’t change after the execution of this instruction.
    // As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn’t happen
    op_dxyn() {
        const rx = (this.opcode & 0x0F00) >> 8;
        const ry = (this.opcode & 0x00F0) >> 4;
        const h = this.opcode & 0x000F;

        const xPos = this.registers[rx] % this.width;
        const yPos = this.registers[ry] % this.height;

        this.registers[15] = 0;

        for (let row = 0; row < h; row++) {
            const spriteByte = this.memory[this.index + row];
            for (let col = 0; col < 8; col++) {
                const spritePixel = spriteByte & (0x80 >> col);
                const screenPixelIndex = yPos * 64 + row * 64 + xPos + col;

                if (spritePixel) {
                    if (this.video[screenPixelIndex] === 0xFF) {
                        this.registers[15] = 1;
                    }
                    this.video[screenPixelIndex] ^= 0xFF;
                }
            }
        }
        this.draw_flag = true;
    }

    // EX9E: Skips the next instruction if the key stored in VX is pressed.
    op_ex9e() {
        const register = (this.opcode & 0x0F00) >> 8;
        if (this.keypad[this.registers[register]]) this.program_counter += 2;
    }

    // EXA1: Skips the next instruction if the key stored in VX isn't pressed.
    op_exa1() {
        const register = (this.opcode & 0x0F00) >> 8;
        if (!this.keypad[this.registers[register]]) this.program_counter += 2;
    }

    // FX07: Sets VX to the value of the delay timer.
    op_fx07() {
        const register = (this.opcode & 0x0F00) >> 8;
        this.registers[register] = this.delay_timer;
    }

    // FX0A: A key press is awaited, and then stored in VX.
    op_fx0a() {
        const register = (this.opcode & 0x0F00) >> 8;
        for (let i = 0; i < 16; i++) {
            if (this.keypad[i]) {
                this.registers[register] = i;
                return 0;
            }
        }
        this.program_counter -= 2;
    }

    // FX15: Sets the delay timer to VX.
    op_fx15() {
        const register = (this.opcode & 0x0F00) >> 8;
        this.delay_timer = this.registers[register];
    }

    // FX55: Stores V0 to VX (including VX) in memory starting at address I.
    // The offset from I is increased by 1 for each value written, but I itself is left unmodified.
    op_fx55() {
        const register = (this.opcode & 0x0F00) >> 8;
        for (let i = 0; i <= register; i++) this.memory[this.index + i] = this.registers[i];
        this.index += register + 1;
    }

    // FX65: Fills V0 to VX (including VX) with values from memory starting at address I.
    // The offset from I is increased by 1 for each value written, but I itself is left unmodified.
    op_fx65() {
        const register = (this.opcode & 0x0F00) >> 8;
        for (let i = 0; i <= register; i++) this.registers[i] = this.memory[this.index + i];
        this.index += register + 1;
    }

    // FX1E: Adds VX to I. VF is not affected.
    op_fx1e() {
        const register = (this.opcode & 0x0F00) >> 8;
        this.registers[15] = this.index + this.registers[register] > 0xFFF? 1 : 0;
        this.index += this.registers[register];
    }

    // FX29: Sets I to the location of the sprite for the character in VX.
    // Characters 0-F (in hexadecimal) are represented by a 4x5 font.
    op_fx29() {
        const register = (this.opcode & 0x0F00) >> 8;
        const digit = this.registers[register];
        this.index = this.font_set_start_address + (5 * digit);
    }

    // FX33: Stores the binary-coded decimal representation of VX,
    // with the most significant of three digits at the address in I,
    // the middle digit at I plus 1, and the least significant digit at I plus 2.
    op_fx33() {
        const register = (this.opcode & 0x0F00) >> 8;
        this.memory[this.index] = (Math.floor(this.registers[register] / 100)) % 10;
        this.memory[this.index + 1] = (Math.floor(this.registers[register] / 10)) % 10;
        this.memory[this.index + 2] = this.registers[register] % 10;
    }
}

module.exports = Chip8;
