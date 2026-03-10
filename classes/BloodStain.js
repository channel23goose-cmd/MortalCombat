export class BloodStain {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.alpha = 0.8;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(150, 0, 0, ${this.alpha})`;
        ctx.beginPath();
        // Irregular shape for blood stain
        ctx.ellipse(this.x, this.y, this.size, this.size / 2.5, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }
}
