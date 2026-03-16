import { SpriteData, getPixelColor } from './SpriteData.js';

export class Fighter {
    constructor({ position, velocity, color, offset, name, facing, controls, sounds, game }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 60;
        this.height = 150;
        this.color = color;
        this.name = name;
        this.facing = facing;
        this.controls = controls;
        this.sounds = sounds;
        this.game = game;

        // Character specific attack properties
        // Remove hyphens and spaces for the lookup
        const lookupName = name.toLowerCase().replace(/[-\s]/g, '');
        this.attackConfig = game.characters[lookupName]?.strikes || {
            punchHigh: { damage: 10, reach: 40, duration: 120, cooldown: 400 },
            punchLow: { damage: 10, reach: 40, duration: 120, cooldown: 400 },
            kickHigh: { damage: 15, reach: 50, duration: 180, cooldown: 500 },
            kickLow: { damage: 15, reach: 50, duration: 180, cooldown: 500 }
        };

        // Determine sprite set
        this.charId = lookupName;
        if (lookupName === 'scorpion' || lookupName === 'subzero' || lookupName === 'reptile') {
            this.spriteId = 'ninja';
        } else if (SpriteData[lookupName]) {
            this.spriteId = lookupName;
        } else {
            this.spriteId = 'ninja'; // Fallback
        }

        this.health = 100;
        this.isAttacking = false;
        this.attackCooldown = false;
        this.onGround = false;
        this.isFrozen = false;
        this.isBlocking = false;
        this.isTeleporting = false;
        this.isSliding = false;
        this.isDead = false;
        this.isDizzy = false;
        this.isCrouching = false;
        this.isLowAttack = false;
        this.newBloodStains = [];

        // Hitbox for attacking
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 100,
            height: 50
        };
        
        // Active attack data for current strike
        this.currentAttack = { damage: 10, reach: 40 };

        this.particles = [];
    }

    draw(ctx) {
        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.position.x + this.width / 2, 620, 50, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player Body (Pixel Art)
        if (!this.isTeleporting) {
            ctx.save();

            // Draw blocking effect
            if (this.isBlocking) {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(this.position.x - 10, this.position.y - 10, this.width + 20, this.height + 20);
            }

            let state = 'idle';
            if (this.isAttacking) state = 'punch';
            else if (this.isCrouching) state = 'crouch';
            if (this.isSliding) state = 'crouch';
            
            let frame = SpriteData[this.spriteId]?.[state];
            if (!frame) frame = SpriteData.ninja[state];
            if (!frame) frame = SpriteData.ninja['idle']; // Failsafe

            // Render the matrix
            // Calculate pixel size to fit the width/height (approx 60x150)
            const pSize = 10;
            const mWidth = frame[0].length * pSize; 
            const mHeight = frame.length * pSize; 
            
            // Adjust X if width is different
            const drawX = this.position.x - (mWidth - this.width) / 2;
            const drawY = this.position.y;

            // Handle freezing tint
            if (this.isFrozen) {
                ctx.globalAlpha = 0.5; // Draw a blue tint over normal colors? Or just replace colors
            }

            for (let r = 0; r < frame.length; r++) {
                const row = frame[r];
                for (let c = 0; c < row.length; c++) {
                    const pixel = row[c];
                    let pColor = getPixelColor(this.charId, pixel, this.color);
                    
                    if (pColor) {
                        if (this.isFrozen && pixel !== '.') {
                            pColor = '#88ccff'; // Override with ice color
                        }
                        ctx.fillStyle = pColor;

                        // Support facing direction
                        let actualC = c;
                        if (this.facing === 'left') {
                            actualC = row.length - 1 - c;
                        }

                        ctx.fillRect(drawX + actualC * pSize, drawY + r * pSize, pSize, pSize);
                    }
                }
            }

            ctx.restore();
        }

        // Draw Name Label (Subtle)
        ctx.fillStyle = 'white';
        ctx.font = '12px Outfit';
        ctx.fillText(this.name, this.position.x, this.position.y - 10);

        // Draw attack box (visual flair)
        if (this.isAttacking && !this.isTeleporting) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            );
            ctx.globalAlpha = 1.0;
        }

        // Draw Particles
        this.drawParticles(ctx);
    }

    drawParticles(ctx) {
        this.particles.forEach((p, index) => {
            if (p.alpha <= 0) {
                this.particles.splice(index, 1);
            } else {
                if (p.y >= 620) {
                    this.newBloodStains.push({ x: p.x, y: p.y, size: p.size * 2 });
                    this.particles.splice(index, 1);
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.2; // Gravity
                    p.alpha -= 0.02;
                    ctx.fillStyle = `rgba(180, 0, 0, ${p.alpha})`;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
        });
    }

    spawnBlood(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                alpha: 1
            });
        }
    }

    update(ctx, canvas, gravity, opponent) {
        this.draw(ctx);

        // Update orientation based on opponent
        if (this.position.x < opponent.position.x) {
            this.facing = 'right';
        } else {
            this.facing = 'left';
        }

        // Update attack box position
        this.attackBox.position.x = this.facing === 'right' ?
            this.position.x + this.width :
            this.position.x - this.attackBox.width;

        if (this.isSliding || this.isLowAttack) {
            this.attackBox.position.y = this.position.y + 100;
        } else {
            this.attackBox.position.y = this.position.y + 30;
        }

        // Handle States
        if (this.isFrozen) {
            this.velocity.x = 0;
            // Freeze lasts for a bit
        }

        // Apply movement
        if (!this.isFrozen) {
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }

        // Apply Gravity
        if (this.position.y + this.height + this.velocity.y >= canvas.height - 100) {
            this.velocity.y = 0;
            this.position.y = canvas.height - 100 - this.height;
            this.onGround = true;
        } else {
            this.velocity.y += gravity;
            this.onGround = false;
        }

        // Screen Boundaries
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;

        // Collision Detection
        if (this.isAttacking &&
            this.rectCollision(this.attackBox, opponent)
        ) {
            this.isAttacking = false;

            // Fatality check
            if (opponent.isDizzy && !opponent.isDead) {
                opponent.isDead = true;
                opponent.isDizzy = false;
                this.spawnBlood(opponent.position.x + opponent.width / 2, opponent.position.y + 50);
                setTimeout(() => {
                    document.getElementById('announcement').innerText += '\nFATALITY';
                }, 500);
            } else {
                opponent.takeDamage(this.isSliding ? 15 : this.currentAttack.damage, this.isLowAttack);
                opponent.spawnBlood(
                    opponent.position.x + opponent.width / 2,
                    opponent.position.y + 50
                );
            }
            console.log(`${this.name} hit ${opponent.name} for ${this.currentAttack.damage}`);
        }

        // Slide logic continuation
        if (this.isSliding) {
            this.velocity.x = this.facing === 'right' ? 12 : -12;
        }
    }

    rectCollision(rect1, rect2) {
        return (
            rect1.position.x < rect2.position.x + rect2.width &&
            rect1.position.x + rect1.width > rect2.position.x &&
            rect1.position.y < rect2.position.y + rect2.height &&
            rect1.position.y + rect1.height > rect2.position.y
        );
    }

    attack(type = 'punch', height = 'high') {
        if (this.attackCooldown || this.isFrozen || this.isDead) return;

        this.isLowAttack = (height === 'low' || this.isCrouching);
        this.isAttacking = true;
        this.attackCooldown = true;

        // Determine specific strike stats
        let strikeType = type + (height === 'high' ? 'High' : 'Low');
        let strikeInfo = this.attackConfig[strikeType];
        
        if (!strikeInfo) strikeInfo = { damage: 10, reach: 40, duration: 120, cooldown: 400 };

        this.currentAttack = strikeInfo;
        this.attackBox.width = strikeInfo.reach;

        if (this.sounds) {
            type === 'punch' ? this.sounds.playPunch() : this.sounds.playKick();
        }

        setTimeout(() => {
            this.isAttacking = false;
            this.isLowAttack = false;
        }, strikeInfo.duration);

        setTimeout(() => {
            this.attackCooldown = false;
        }, strikeInfo.cooldown);
    }

    takeDamage(amount, isLow) {
        // Crouch blocks beats low attacks, standing block beats high
        const blocked = this.isBlocking && (isLow ? this.isCrouching : !this.isCrouching);

        if (blocked) {
            amount /= 4;
            if (this.sounds) this.sounds.playKick();
        } else {
            if (this.sounds) this.sounds.playPunch();
            if (this.game) this.game.triggerShake(5, 10);
        }

        this.health -= amount;
        if (this.health < 0) this.health = 0;
        if (this.health === 0) this.isDead = true;
    }

    block(isBlocking) {
        this.isBlocking = isBlocking;
    }

    teleport(opponentX) {
        if (this.attackCooldown || this.isFrozen) return;
        this.isTeleporting = true;
        this.attackCooldown = true;

        setTimeout(() => {
            // Reappear behind opponent
            this.position.x = opponentX + (this.position.x < opponentX ? 100 : -100);
            this.isTeleporting = false;
            this.attack(); // Auto attack after teleport
        }, 300);

        setTimeout(() => {
            this.attackCooldown = false;
        }, 1500);
    }

    slide() {
        if (this.attackCooldown || this.isFrozen || !this.onGround) return;
        this.isSliding = true;
        this.isAttacking = true;
        this.attackCooldown = true;

        setTimeout(() => {
            this.isSliding = false;
            this.isAttacking = false;
        }, 500);

        setTimeout(() => {
            this.attackCooldown = false;
        }, 1200);
    }

    freeze() {
        this.isFrozen = true;
        setTimeout(() => {
            this.isFrozen = false;
        }, 2000);
    }

    pull(targetX) {
        this.isFrozen = true; // Stun during pull
        const interval = setInterval(() => {
            if (Math.abs(this.position.x - targetX) < 100) {
                clearInterval(interval);
                this.isFrozen = true; // Stay stunned briefly
                setTimeout(() => this.isFrozen = false, 500);
                return;
            }
            if (this.position.x < targetX) this.position.x += 15;
            else this.position.x -= 15;
        }, 20);

        setTimeout(() => {
            clearInterval(interval);
            this.isFrozen = false;
        }, 1500);
    }
}
