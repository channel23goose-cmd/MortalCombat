import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
    <div id="game-container">
        <div id="selection-screen">
            <h2 id="selection-title">SELECT YOUR FIGHTER</h2>
            <div id="character-grid">
                <div class="char-slot" data-char="scorpion"></div>
                <div class="char-slot" data-char="subzero"></div>
            </div>
            <div id="selection-info">
                <div class="p1-choice">P1: <span id="p1-selected">NONE</span></div>
                <div class="p2-choice">P2: <span id="p2-selected">NONE</span></div>
            </div>
            <div id="start-hint">PRESS SPACE TO FIGHT</div>
        </div>
        <div id="hud">
            <div class="player-stats p1">
                <div class="name">SCORPION</div>
                <div class="health-bar-container">
                    <div id="p1-health" class="health-bar-inner"></div>
                </div>
            </div>
            <div id="timer-container">
                <div id="timer">99</div>
            </div>
            <div class="player-stats p2">
                <div class="name">SUB-ZERO</div>
                <div class="health-bar-container">
                    <div id="p2-health" class="health-bar-inner"></div>
                </div>
            </div>
        </div>
        <div id="game-messages">
            <h1 id="announcement"></h1>
        </div>
        <canvas id="gameCanvas" width="1280" height="720"></canvas>
    </div>
</body>
</html>`, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});

// Mock Canvas getContext
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => { },
    clearRect: () => { },
    getImageData: () => ({ data: [] }),
    putImageData: () => { },
    createImageData: () => [],
    setTransform: () => { },
    drawImage: () => { },
    save: () => { },
    fillText: () => { },
    restore: () => { },
    beginPath: () => { },
    moveTo: () => { },
    lineTo: () => { },
    closePath: () => { },
    stroke: () => { },
    translate: () => { },
    scale: () => { },
    rotate: () => { },
    arc: () => { },
    fill: () => { },
    measureText: () => ({ width: 0 }),
    transform: () => { },
    rect: () => { },
    clip: () => { },
    ellipse: () => { },
    strokeRect: () => { },
    createLinearGradient: () => ({ addColorStop: () => { } }),
});

// Mock Image
dom.window.Image = class {
    constructor() { this.onload = () => { }; }
};

// Mock Audio
dom.window.Audio = class {
    constructor() {
        this.play = () => Promise.resolve();
        this.pause = () => { };
        this.load = () => { };
    }
};
dom.window.AudioContext = class {
    constructor() {
        this.createOscillator = () => ({
            connect: () => { },
            start: () => { },
            stop: () => { },
            frequency: { setValueAtTime: () => { }, exponentialRampToValueAtTime: () => { } }
        });
        this.createGain = () => ({
            connect: () => { },
            gain: { setValueAtTime: () => { }, exponentialRampToValueAtTime: () => { } }
        });
    }
};

// Polyfills
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: "node.js" };
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = clearTimeout;
global.AudioContext = dom.window.AudioContext;
global.Image = dom.window.Image;

console.log("Environment simulated. Loading game.js...");

// Import dynamically to catch initialization errors
import('./game.js').then((module) => {
    console.log("Game module loaded successfully");

    // Test space key
    console.log("Firing Space keydown...");
    const spaceEvent = new dom.window.KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true });
    dom.window.document.dispatchEvent(spaceEvent);

    setTimeout(() => {
        console.log("Firing WASD keys...");
        const dEvent = new dom.window.KeyboardEvent('keydown', { key: 'd', code: 'KeyD', bubbles: true });
        dom.window.document.dispatchEvent(dEvent);

        setTimeout(() => {
            console.log("Done checking.");
            process.exit(0);
        }, 100);
    }, 100);
}).catch(err => {
    console.error("Game module failed to load:", err);
    process.exit(1);
});
