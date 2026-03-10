/**
 * Procedural Sound Engine for Mortal Kombat JS
 */
export class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playPunch() {
        this.playNoise(0.1, 100, 400, 0.5);
    }

    playKick() {
        this.playNoise(0.15, 80, 300, 0.7);
    }

    playSpear() {
        this.playTone(800, 100, 0.1, 'sawtooth');
    }

    playIce() {
        this.playNoise(0.5, 2000, 500, 0.3);
    }

    playTeleport() {
        this.playTone(200, 800, 0.2, 'sine');
    }

    playAcid() {
        this.playNoise(0.4, 400, 100, 0.4);
    }

    playFinishHim() {
        this.playTone(100, 50, 1.0, 'square');
    }

    playNoise(duration, startFreq, endFreq, volume) {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playTone(startFreq, endFreq, duration, type = 'sine') {
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}
