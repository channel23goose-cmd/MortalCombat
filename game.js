/**
 * Mortal Kombat JS - Core Game Loop
 */

import { Fighter } from './classes/Fighter.js';
import { InputHandler } from './classes/InputHandler.js';
import { Projectile } from './classes/Projectile.js';
import { BloodStain } from './classes/BloodStain.js';
import { SoundEngine } from './classes/SoundEngine.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Match canvas to the container resolution
        this.canvas.width = 1280;
        this.canvas.height = 720;

        this.gravity = 0.7;
        this.groundLevel = 0; // Relative to bottom

        this.input = new InputHandler();

        // Initialize Fighters
        this.player1 = new Fighter({
            position: { x: 200, y: 100 },
            velocity: { x: 0, y: 0 },
            color: '#ffcc00', // Scorpion
            offset: { x: 0, y: 0 },
            name: 'Scorpion',
            facing: 'right',
            controls: {
                left: 'KeyA',
                right: 'KeyD',
                jump: 'KeyW',
                crouch: 'KeyS',
                attack: 'KeyF',
                block: 'KeyG'
            },
            sounds: this.sounds,
            game: this
        });

        this.player2 = new Fighter({
            position: { x: 900, y: 100 },
            velocity: { x: 0, y: 0 },
            color: '#33ccff', // Sub-Zero
            offset: { x: 0, y: 0 },
            name: 'Sub-Zero',
            facing: 'left',
            controls: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                jump: 'ArrowUp',
                attack: 'Period',
                block: 'Slash'
            },
            sounds: this.sounds,
            game: this
        });

        this.timer = 99;
        this.timerId = null;
        this.isGameOver = false;

        this.projectiles = [];
        this.bloodStains = [];
        this.lastP1Special = 0;
        this.lastP2Special = 0;
        this.finishHimTriggered = false;

        this.sounds = new SoundEngine();
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        this.gameState = 'selection'; // 'selection' or 'fighting'
        this.p1Choice = 'scorpion';
        this.p2Choice = 'subzero';
        this.characters = {
            scorpion: { color: '#ffcc00', name: 'SCORPION' },
            subzero: { color: '#33ccff', name: 'SUB-ZERO' },
            reptile: { color: '#22dd22', name: 'REPTILE' }
        };

        this.init();
    }

    init() {
        console.log("Game Initialized");
        this.setupSelectionListeners();
        this.animate();
    }

    setupSelectionListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'selection') return;

            // Simple P1 selection (WASD)
            if (e.code === 'KeyD') this.cycleSelection('p1', 1);
            if (e.code === 'KeyA') this.cycleSelection('p1', -1);

            // Simple P2 selection (Arrows)
            if (e.code === 'ArrowRight') this.cycleSelection('p2', 1);
            if (e.code === 'ArrowLeft') this.cycleSelection('p2', -1);

            if (e.code === 'Space') this.startGame();
        });
        this.updateSelectionUI();
    }

    cycleSelection(player, dir) {
        const charKeys = Object.keys(this.characters);
        if (player === 'p1') {
            let idx = charKeys.indexOf(this.p1Choice);
            idx = (idx + dir + charKeys.length) % charKeys.length;
            this.p1Choice = charKeys[idx];
        } else {
            let idx = charKeys.indexOf(this.p2Choice);
            idx = (idx + dir + charKeys.length) % charKeys.length;
            this.p2Choice = charKeys[idx];
        }
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        document.getElementById('p1-selected').innerText = this.p1Choice.toUpperCase();
        document.getElementById('p2-selected').innerText = this.p2Choice.toUpperCase();

        document.querySelectorAll('.char-slot').forEach(slot => {
            slot.classList.remove('active-p1', 'active-p2');
            if (slot.dataset.char === this.p1Choice) slot.classList.add('active-p1');
            if (slot.dataset.char === this.p2Choice) slot.classList.add('active-p2');
        });
    }

    startGame() {
        this.gameState = 'fighting';
        document.getElementById('selection-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'flex';

        // Re-initialize players with chosen characters
        this.player1 = new Fighter({
            position: { x: 200, y: 100 },
            velocity: { x: 0, y: 0 },
            color: this.characters[this.p1Choice].color,
            name: this.characters[this.p1Choice].name,
            facing: 'right',
            controls: {
                left: 'KeyA',
                right: 'KeyD',
                jump: 'KeyW',
                crouch: 'KeyS',
                attack: 'KeyF',
                block: 'KeyG'
            },
            sounds: this.sounds,
            game: this
        });

        this.player2 = new Fighter({
            position: { x: 900, y: 100 },
            velocity: { x: 0, y: 0 },
            color: this.characters[this.p2Choice].color,
            name: this.characters[this.p2Choice].name,
            facing: 'left',
            controls: {
                left: 'ArrowLeft',
                right: 'ArrowRight',
                jump: 'ArrowUp',
                crouch: 'ArrowDown',
                attack: 'Period',
                block: 'Slash'
            },
            sounds: this.sounds,
            game: this
        });

        document.querySelector('.p1 .name').innerText = this.player1.name;
        document.querySelector('.p2 .name').innerText = this.player2.name;

        this.decreaseTimer();
    }

    decreaseTimer() {
        if (this.timer > 0 && !this.isGameOver) {
            this.timerId = setTimeout(() => {
                this.timer--;
                document.getElementById('timer').innerText = this.timer;
                this.decreaseTimer();
            }, 1000);
        }

        if (this.timer === 0) {
            this.determineWinner();
        }
    }

    determineWinner() {
        if (this.isGameOver) return;

        clearTimeout(this.timerId);
        this.isGameOver = true;

        const announce = document.getElementById('announcement');
        announce.style.display = 'block';
        announce.style.color = '#fff';

        if (this.player1.health === this.player2.health) {
            announce.innerText = 'TIE';
        } else if (this.player1.health > this.player2.health) {
            announce.innerText = 'SCORPION WINS';
            announce.style.textShadow = '0 0 20px #ffcc00';
        } else {
            announce.innerText = 'SUB-ZERO WINS';
            announce.style.textShadow = '0 0 20px #33ccff';
        }

        // Add Restart Button
        const restartBtn = document.createElement('button');
        restartBtn.innerText = 'RESTART';
        restartBtn.id = 'restart-btn';
        restartBtn.onclick = () => window.location.reload();
        document.getElementById('game-messages').appendChild(restartBtn);
    }

    triggerFinishHim() {
        if (this.finishHimTriggered) return;
        this.finishHimTriggered = true;

        const announce = document.getElementById('announcement');
        announce.innerText = 'FINISH HIM!';
        announce.style.display = 'block';
        announce.style.color = '#ff3333';
        this.sounds.playFinishHim();

        // Hide after 2 seconds but stay in "finishing" mode
        setTimeout(() => {
            if (!this.isGameOver) announce.style.display = 'none';
        }, 2000);
    }

    animate() {
        window.requestAnimationFrame(() => this.animate());

        if (this.gameState === 'selection') return;

        this.ctx.save();

        // Handle Screen Shake
        if (this.shakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity;
            const sy = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(sx, sy);
            this.shakeTimer--;
        }

        // Background (The Pit Style)
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0f');
        gradient.addColorStop(0.5, '#151520');
        gradient.addColorStop(1, '#050505');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Moon or light source
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.beginPath();
        this.ctx.arc(1000, 150, 80, 0, Math.PI * 2);
        this.ctx.fill();

        // Far Background structures (mountains/spikes)
        this.ctx.fillStyle = '#080808';
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 300, 620);
            this.ctx.lineTo(i * 300 + 150, 400);
            this.ctx.lineTo(i * 300 + 300, 620);
            this.ctx.fill();
        }

        // Bridge/Platform
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 620, this.canvas.width, 100);

        // Spikes below
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 720);
            this.ctx.lineTo(i + 20, 650);
            this.ctx.lineTo(i + 40, 720);
            this.ctx.stroke();
        }

        // Render Ground Blood
        this.bloodStains.forEach(bs => bs.draw(this.ctx));

        // Update Projectiles
        this.projectiles.forEach((p, index) => {
            p.update(this.ctx, this.canvas, p.owner === this.player1 ? this.player2 : this.player1);
            if (!p.active) this.projectiles.splice(index, 1);
        });

        this.player1.update(this.ctx, this.canvas, this.gravity, this.player2);
        this.player2.update(this.ctx, this.canvas, this.gravity, this.player1);

        // Collect new blood stains from fighters
        [this.player1, this.player2].forEach(p => {
            p.newBloodStains.forEach(nbs => {
                this.bloodStains.push(new BloodStain(nbs.x, nbs.y, nbs.size));
            });
            p.newBloodStains = [];
        });

        // Update HUD
        document.getElementById('p1-health').style.width = this.player1.health + '%';
        document.getElementById('p2-health').style.width = this.player2.health + '%';

        // Delayed damage bar effect
        setTimeout(() => {
            document.querySelector('.p1 .health-bar-damage').style.width = this.player1.health + '%';
            document.querySelector('.p2 .health-bar-damage').style.width = this.player2.health + '%';
        }, 400);

        // Handle Input
        this.handleMovement();

        // Check for Finish Him or Game Over
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            if (!this.finishHimTriggered) {
                this.triggerFinishHim();
                // Set the low health player to dizzy
                if (this.player1.health <= 0) this.player1.isDizzy = true;
                if (this.player2.health <= 0) this.player2.isDizzy = true;
            }

            // To win, you must land a final hit OR wait for time
            if (this.player1.isDead || this.player2.isDead) {
                this.determineWinner();
            }
        }

        this.ctx.restore();
    }

    triggerShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    handleMovement() {
        // Player 1
        this.player1.velocity.x = 0;
        if (this.input.keys[this.player1.controls.left]) this.player1.velocity.x = -8;
        if (this.input.keys[this.player1.controls.right]) this.player1.velocity.x = 8;
        if (this.input.keys[this.player1.controls.jump] && this.player1.onGround) {
            this.player1.velocity.y = -20;
            this.player1.onGround = false;
        }
        this.player1.isCrouching = this.input.keys[this.player1.controls.crouch] && this.player1.onGround;

        // Player 2
        this.player2.velocity.x = 0;
        if (this.input.keys[this.player2.controls.left]) this.player2.velocity.x = -8;
        if (this.input.keys[this.player2.controls.right]) this.player2.velocity.x = 8;
        if (this.input.keys[this.player2.controls.jump] && this.player2.onGround) {
            this.player2.velocity.y = -20;
            this.player2.onGround = false;
        }
        this.player2.isCrouching = this.input.keys[this.player2.controls.crouch] && this.player2.onGround;

        // Player 1 Blocking
        this.player1.block(this.input.keys[this.player1.controls.block]);

        // Player 2 Blocking
        this.player2.block(this.input.keys[this.player2.controls.block]);

        // Attacks
        if (this.input.keys[this.player1.controls.attack]) {
            this.player1.attack(this.player1.isCrouching ? 'low' : 'high');
        }
        if (this.input.keys[this.player2.controls.attack]) {
            this.player2.attack(this.player2.isCrouching ? 'low' : 'high');
        }

        // Special Moves
        const now = Date.now();

        // Scorpion Spear (E)
        if (this.input.keys['KeyE'] && now - this.lastP1Special > 2000) {
            this.sounds.playSpear();
            this.projectiles.push(new Projectile({
                position: { x: this.player1.position.x + this.player1.width, y: this.player1.position.y + 50 },
                velocity: { x: this.player1.facing === 'right' ? 15 : -15, y: 0 },
                color: '#ffcc00',
                size: 20,
                type: 'spear',
                owner: this.player1,
                sounds: this.sounds // Pass sounds to projectile
            }));
            this.lastP1Special = now;
        }

        // Scorpion Teleport (Q)
        if (this.input.keys['KeyQ'] && now - this.lastP1Special > 3000) {
            this.sounds.playTeleport();
            this.player1.teleport(this.player2.position.x);
            this.lastP1Special = now;
        }

        // Sub-Zero Ice Ball (Enter)
        if (this.input.keys['Enter'] && now - this.lastP2Special > 2000) {
            this.sounds.playIce();
            this.projectiles.push(new Projectile({
                position: { x: this.player2.position.x - 20, y: this.player2.position.y + 50 },
                velocity: { x: this.player2.facing === 'left' ? -12 : 12, y: 0 },
                color: '#33ccff',
                size: 30,
                type: 'ice',
                owner: this.player2,
                sounds: this.sounds // Pass sounds
            }));
            this.lastP2Special = now;
        }

        // Sub-Zero Slide (ShiftRight)
        if (this.input.keys['ShiftRight'] && now - this.lastP2Special > 1500) {
            this.player2.slide();
            this.lastP2Special = now;
        }

        // Reptile Acid Spit (R for P1, Backslash for P2)
        if (this.p1Choice === 'reptile' && this.input.keys['KeyR'] && now - this.lastP1Special > 1500) {
            this.sounds.playAcid();
            this.projectiles.push(new Projectile({
                position: { x: this.player1.position.x + this.player1.width, y: this.player1.position.y + 40 },
                velocity: { x: this.player1.facing === 'right' ? 12 : -12, y: 0 },
                color: '#22dd22',
                size: 25,
                type: 'acid',
                owner: this.player1,
                sounds: this.sounds
            }));
            this.lastP1Special = now;
        }

        if (this.p2Choice === 'reptile' && this.input.keys['Backslash'] && now - this.lastP2Special > 1500) {
            this.sounds.playAcid();
            this.projectiles.push(new Projectile({
                position: { x: this.player2.position.x - 20, y: this.player2.position.y + 40 },
                velocity: { x: this.player2.facing === 'left' ? -12 : 12, y: 0 },
                color: '#22dd22',
                size: 25,
                type: 'acid',
                owner: this.player2,
                sounds: this.sounds
            }));
            this.lastP2Special = now;
        }
    }
}

const game = new Game();
