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

        // Note: Removed the temporary player 1/2 instantiation from top of constructor
        // Because they are actually initialized in startGame() and rely on SoundEngine which was moved

        this.gameState = 'selection'; // 'selection' or 'fighting'
        this.p1Choice = 'scorpion';
        this.p2Choice = 'subzero';
        this.characters = {
            scorpion: { 
                color: '#ffcc00', name: 'SCORPION',
                strikes: {
                    punchHigh: { damage: 12, reach: 45, duration: 120, cooldown: 350 },
                    punchLow: { damage: 10, reach: 40, duration: 110, cooldown: 350 },
                    kickHigh: { damage: 15, reach: 55, duration: 150, cooldown: 450 },
                    kickLow: { damage: 12, reach: 50, duration: 140, cooldown: 400 }
                }
            },
            subzero: { 
                color: '#33ccff', name: 'SUB-ZERO',
                strikes: {
                    punchHigh: { damage: 10, reach: 40, duration: 110, cooldown: 380 },
                    punchLow: { damage: 10, reach: 40, duration: 110, cooldown: 350 },
                    kickHigh: { damage: 18, reach: 50, duration: 160, cooldown: 500 }, // Heavy kick
                    kickLow: { damage: 12, reach: 50, duration: 140, cooldown: 400 }
                }
            },
            liukang: { 
                color: '#ff3333', name: 'LIU KANG',
                strikes: {
                    // Fast, lower damage
                    punchHigh: { damage: 8, reach: 35, duration: 90, cooldown: 250 },
                    punchLow: { damage: 8, reach: 35, duration: 90, cooldown: 250 },
                    kickHigh: { damage: 12, reach: 50, duration: 120, cooldown: 350 }, // Famous kicks
                    kickLow: { damage: 10, reach: 45, duration: 110, cooldown: 350 }
                }
            },
            reptile: { 
                color: '#22dd22', name: 'REPTILE',
                strikes: {
                    // Fast punches, medium kicks
                    punchHigh: { damage: 9, reach: 40, duration: 100, cooldown: 300 },
                    punchLow: { damage: 9, reach: 40, duration: 100, cooldown: 300 },
                    kickHigh: { damage: 14, reach: 45, duration: 140, cooldown: 400 },
                    kickLow: { damage: 11, reach: 45, duration: 130, cooldown: 380 }
                }
            },
            jax: { 
                color: '#888888', name: 'JAX',
                strikes: {
                    // Slow, heavy damage, short reach (punch-focused)
                    punchHigh: { damage: 20, reach: 40, duration: 200, cooldown: 600 },
                    punchLow: { damage: 18, reach: 40, duration: 180, cooldown: 550 },
                    kickHigh: { damage: 22, reach: 45, duration: 220, cooldown: 600 },
                    kickLow: { damage: 15, reach: 45, duration: 180, cooldown: 500 }
                }
            },
            raiden: { 
                color: '#ffffff', name: 'RAIDEN',
                strikes: {
                    // Long reach, medium damage
                    punchHigh: { damage: 12, reach: 55, duration: 130, cooldown: 400 },
                    punchLow: { damage: 10, reach: 50, duration: 120, cooldown: 400 },
                    kickHigh: { damage: 15, reach: 60, duration: 160, cooldown: 500 },
                    kickLow: { damage: 12, reach: 55, duration: 150, cooldown: 450 }
                }
            }
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

            // Player 1 cycle: left/right (A/D) or up/down (W/S) both move through list
            if (e.code === 'KeyD' || e.code === 'KeyS') this.cycleSelection('p1', 1);
            if (e.code === 'KeyA' || e.code === 'KeyW') this.cycleSelection('p1', -1);

            // Player 2 cycle: arrow keys or P/L and ' to keep same layout as fight
            if (e.code === 'ArrowRight' || e.code === 'KeyL') this.cycleSelection('p2', 1);
            if (e.code === 'ArrowLeft' || e.code === 'Quote') this.cycleSelection('p2', -1);

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

        // Player 1 Controls: wsda + zxcv
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
                attack1: 'KeyZ',
                attack2: 'KeyX',
                attack3: 'KeyC',
                attack4: 'KeyV',
                block: 'KeyB' // Keep block or use one of attack keys? User said zxcv are attacks.
            },
            sounds: this.sounds,
            game: this
        });

        // Player 2 Controls: p;'l + /.,m
        // Target: P=Up, Semicolon=Down, L=Left, Quote=Right
        this.player2 = new Fighter({
            position: { x: 900, y: 100 },
            velocity: { x: 0, y: 0 },
            color: this.characters[this.p2Choice].color,
            name: this.characters[this.p2Choice].name,
            facing: 'left',
            controls: {
                left: 'KeyL',
                right: 'Quote',
                jump: 'KeyP',
                crouch: 'Semicolon',
                attack1: 'Slash',  // /
                attack2: 'Period', // .
                attack3: 'Comma',  // ,
                attack4: 'KeyM',   // M
                block: 'KeyK',
                special1: 'KeyO',
                special2: 'KeyI'
            },
            sounds: this.sounds,
            game: this
        });

        // Add P1 special keys
        this.player1.controls.special1 = 'KeyE';
        this.player1.controls.special2 = 'KeyQ';

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

        // Attacks P1
        if (this.input.keys[this.player1.controls.attack1]) this.player1.attack('punch', 'high');
        if (this.input.keys[this.player1.controls.attack2]) this.player1.attack('punch', 'low');
        if (this.input.keys[this.player1.controls.attack3]) this.player1.attack('kick', 'high');
        if (this.input.keys[this.player1.controls.attack4]) this.player1.attack('kick', 'low');

        // Attacks P2
        if (this.input.keys[this.player2.controls.attack4]) this.player2.attack('punch', 'high'); // M
        if (this.input.keys[this.player2.controls.attack3]) this.player2.attack('punch', 'low');  // ,
        if (this.input.keys[this.player2.controls.attack2]) this.player2.attack('kick', 'high');   // .
        if (this.input.keys[this.player2.controls.attack1]) this.player2.attack('kick', 'low');    // /

        // Special Moves Logic
        const now = Date.now();
        this.handleSpecials(this.player1, this.p1Choice, 'lastP1Special', now);
        this.handleSpecials(this.player2, this.p2Choice, 'lastP2Special', now);
    }

    handleSpecials(player, char, cooldownKey, now) {
        if (now - this[cooldownKey] < 1500) return;

        const isS1 = this.input.keys[player.controls.special1];
        const isS2 = this.input.keys[player.controls.special2];

        if (!isS1 && !isS2) return;

        if (char === 'scorpion') {
            if (isS1) {
                this.sounds.playSpear();
                this.projectiles.push(new Projectile({
                    position: { x: player.position.x + (player.facing === 'right' ? 50 : -20), y: player.position.y + 40 },
                    velocity: { x: player.facing === 'right' ? 15 : -15, y: 0 },
                    color: '#ffcc00', size: 30, type: 'spear', owner: player, sounds: this.sounds
                }));
                this[cooldownKey] = now;
            } else if (isS2) {
                player.teleport(player.facing === 'right' ? 1000 : 200);
                this[cooldownKey] = now;
            }
        } else if (char === 'subzero') {
            if (isS1) {
                this.sounds.playIceBall();
                this.projectiles.push(new Projectile({
                    position: { x: player.position.x + (player.facing === 'right' ? 50 : -20), y: player.position.y + 40 },
                    velocity: { x: player.facing === 'right' ? 10 : -10, y: 0 },
                    color: '#33ccff', size: 25, type: 'iceball', owner: player, sounds: this.sounds
                }));
                this[cooldownKey] = now;
            } else if (isS2) {
                player.slide();
                this[cooldownKey] = now;
            }
        } else if (char === 'liukang') {
            if (isS1) {
                this.sounds.playFireball();
                this.projectiles.push(new Projectile({
                    position: { x: player.position.x + (player.facing === 'right' ? 50 : -20), y: player.position.y + 40 },
                    velocity: { x: player.facing === 'right' ? 18 : -18, y: 0 },
                    color: '#ff3300', size: 30, type: 'fireball', owner: player, sounds: this.sounds
                }));
                this[cooldownKey] = now;
            }
        } else if (char === 'jax') {
            if (isS1) {
                this.sounds.playEarthquake();
                this.triggerShake(10, 20);
                // Damage based on proximity
                const dist = Math.abs(this.player1.position.x - this.player2.position.x);
                if (dist < 400) {
                    const target = (player === this.player1) ? this.player2 : this.player1;
                    target.takeDamage(10, true);
                }
                this[cooldownKey] = now;
            }
        } else if (char === 'raiden') {
            if (isS1) {
                this.sounds.playLightning();
                this.projectiles.push(new Projectile({
                    position: { x: player.position.x + (player.facing === 'right' ? 50 : -20), y: player.position.y + 40 },
                    velocity: { x: player.facing === 'right' ? 20 : -20, y: 0 },
                    color: '#88ccff', size: 40, type: 'lightning', owner: player, sounds: this.sounds
                }));
                this[cooldownKey] = now;
            } else if (isS2) {
                player.teleport(player.facing === 'right' ? 1000 : 200);
                this[cooldownKey] = now;
            }
        } else if (char === 'reptile') {
            if (isS1) {
                this.sounds.playAcid();
                this.projectiles.push(new Projectile({
                    position: { x: player.position.x + (player.facing === 'right' ? 50 : -20), y: player.position.y + 40 },
                    velocity: { x: player.facing === 'right' ? 12 : -12, y: 0 },
                    color: '#22dd22', size: 25, type: 'acid', owner: player, sounds: this.sounds
                }));
                this[cooldownKey] = now;
            } else if (isS2) {
                player.slide();
                this[cooldownKey] = now;
            }
        }
    }
}

const game = new Game();
