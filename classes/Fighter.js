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

        this.particles = [];
    }

    draw(ctx) {
        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.position.x + this.width / 2, 620, 50, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Player Body (Ninja Base)
        if (!this.isTeleporting) {
            ctx.save();

            // Draw blocking effect
            if (this.isBlocking) {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.strokeRect(this.position.x - 10, this.position.y - 10, this.width + 20, this.height + 20);
            }

            // Body
            ctx.fillStyle = this.isFrozen ? '#88ccff' : '#111'; // Black suit
            if (this.isSliding) {
                ctx.fillRect(this.position.x, this.position.y + 75, this.width + 40, this.height - 75);
            } else if (this.isCrouching) {
                ctx.fillRect(this.position.x, this.position.y + 75, this.width, this.height - 75);
            } else {
                ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            }

            // Tabard (The colored part)
            ctx.fillStyle = this.isFrozen ? '#88ccff' : this.color;
            if (this.isSliding) {
                // No tabard detail needed for slide
            } else if (this.isCrouching) {
                ctx.fillRect(this.position.x + 5, this.position.y + 90, 50, 40);
                // Mask
                ctx.fillRect(this.position.x + 10, this.position.y + 80, 40, 10);
            } else {
                // Character specific details
                if (this.name === 'JAX') {
                    // Jax has silver arms
                    ctx.fillStyle = '#bbb';
                    ctx.fillRect(this.position.x - 10, this.position.y + 30, 20, 60);
                    ctx.fillRect(this.position.x + 50, this.position.y + 30, 20, 60);
                    ctx.fillStyle = this.color;
                }

                // Chest piece
                ctx.fillRect(this.position.x + 10, this.position.y + 30, 40, 60);
                // Belt
                ctx.fillRect(this.position.x, this.position.y + 90, this.width, 10);
                // Mask/Headband
                if (this.name === 'LIU KANG') {
                    ctx.fillRect(this.position.x + 5, this.position.y + 10, 50, 5); // Headband
                } else if (this.name === 'RAIDEN') {
                    ctx.fillStyle = '#ddd';
                    ctx.beginPath(); // Straw hat
                    ctx.moveTo(this.position.x - 10, this.position.y + 20);
                    ctx.lineTo(this.position.x + 70, this.position.y + 20);
                    ctx.lineTo(this.position.x + 30, this.position.y);
                    ctx.fill();
                    ctx.fillStyle = this.color;
                } else {
                    ctx.fillRect(this.position.x + 10, this.position.y + 10, 40, 15);
                }
            }

            // Head and Eyes
            ctx.fillStyle = this.isFrozen ? '#fff' : '#000';
            const eyeX = this.facing === 'right' ? this.position.x + 40 : this.position.x + 10;
            const eyeY = this.isCrouching ? this.position.y + 85 : this.position.y + 15;
            ctx.fillRect(eyeX, eyeY, 10, 4);

            ctx.restore();
        }

        // Draw Name Label (Subtle)
        ctx.fillStyle = 'white';
        ctx.font = '12px Outfit';
        ctx.fillText(this.name, this.position.x, this.position.y - 10);

        // Draw attack box (only when attacking - debug or dev mode)
        /*
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            ctx.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            );
        }
        */

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
                opponent.takeDamage(this.isSliding ? 15 : 10, this.isLowAttack);
                opponent.spawnBlood(
                    opponent.position.x + opponent.width / 2,
                    opponent.position.y + 50
                );
            }
            console.log(`${this.name} hit ${opponent.name}`);
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

        if (this.sounds) {
            type === 'punch' ? this.sounds.playPunch() : this.sounds.playKick();
        }

        setTimeout(() => {
            this.isAttacking = false;
            this.isLowAttack = false;
        }, 120);

        setTimeout(() => {
            this.attackCooldown = false;
        }, 400); // Faster recovery than before
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
