export class Projectile {
    constructor({ position, velocity, color, size, type, owner, sounds }) {
        this.position = position;
        this.velocity = velocity;
        this.color = color;
        this.size = size;
        this.type = type; // 'ice', 'spear', etc.
        this.owner = owner;
        this.sounds = sounds;
        this.width = size;
        this.height = size;
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        if (this.type === 'spear') {
            // Scorpion's Spear (looks like a kunai on a rope)
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.owner.position.x + this.owner.width / 2, this.owner.position.y + 50);
            ctx.lineTo(this.position.x, this.position.y + this.size / 2);
            ctx.stroke();

            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.position.x + 20 * (this.velocity.x > 0 ? 1 : -1), this.position.y + this.size / 2);
            ctx.lineTo(this.position.x, this.position.y + this.size);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'ice') {
            // Sub-Zero's Ice Ball
            const gradient = ctx.createRadialGradient(
                this.position.x + this.size / 2, this.position.y + this.size / 2, 0,
                this.position.x + this.size / 2, this.position.y + this.size / 2, this.size / 2
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#33ccff');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.position.x + this.size / 2, this.position.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    update(ctx, canvas, opponent) {
        this.draw(ctx);
        this.position.x += this.velocity.x;

        // Check for collision with opponent
        if (this.rectCollision(this, opponent)) {
            this.handleCollision(opponent);
            this.active = false;
        }

        // Out of bounds
        if (this.position.x < 0 || this.position.x > canvas.width) {
            this.active = false;
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

    handleCollision(opponent) {
        if (this.type === 'ice') {
            if (this.sounds) this.sounds.playIce();
            opponent.freeze();
            opponent.takeDamage(5);
        } else if (this.type === 'spear') {
            if (this.sounds) this.sounds.playPunch();
            opponent.pull(this.owner.position.x);
            opponent.takeDamage(5);
        }
    }
}
