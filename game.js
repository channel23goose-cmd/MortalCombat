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
        this.mapChoice = 'thepit';

        // ── MK XL-inspired stages ──
        this.maps = {
            thepit: {
                name: 'THE PIT',
                // Dark bridge over a spike pit, silhouetted mountains, moon
                thumbGradient: ['#0a0a1a', '#1a0a00'],
                thumbAccent: '#ff6600',
                render: (ctx, W, H) => {
                    // Sky
                    const sky = ctx.createLinearGradient(0, 0, 0, H);
                    sky.addColorStop(0, '#0a0a1a'); sky.addColorStop(0.7, '#1a0005'); sky.addColorStop(1, '#050505');
                    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
                    // Moon
                    ctx.fillStyle = 'rgba(255,230,180,0.08)'; ctx.beginPath(); ctx.arc(1000, 100, 90, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,230,180,0.04)'; ctx.beginPath(); ctx.arc(1000, 100, 130, 0, Math.PI*2); ctx.fill();
                    // Far mountains
                    ctx.fillStyle = '#0d0008';
                    for (let i=0;i<6;i++) { ctx.beginPath(); ctx.moveTo(i*240,H-100); ctx.lineTo(i*240+120,H-340); ctx.lineTo(i*240+240,H-100); ctx.fill(); }
                    // Torches on walls
                    [[120,H-105],[W-120,H-105]].forEach(([tx,ty])=>{
                        ctx.fillStyle='#cc4400'; ctx.fillRect(tx-4,ty-40,8,30);
                        const flm=ctx.createRadialGradient(tx,ty-50,2,tx,ty-50,28);
                        flm.addColorStop(0,'rgba(255,200,0,0.9)'); flm.addColorStop(1,'rgba(255,60,0,0)');
                        ctx.fillStyle=flm; ctx.beginPath(); ctx.arc(tx,ty-50,28,0,Math.PI*2); ctx.fill();
                    });
                    // Bridge platform
                    const plat = ctx.createLinearGradient(0,H-100,0,H);
                    plat.addColorStop(0,'#1e1410'); plat.addColorStop(1,'#0a0805');
                    ctx.fillStyle=plat; ctx.fillRect(0,H-100,W,120);
                    // Stone lines on bridge
                    ctx.strokeStyle='rgba(60,40,20,0.5)'; ctx.lineWidth=2;
                    for(let i=0;i<W;i+=60){ctx.beginPath();ctx.moveTo(i,H-100);ctx.lineTo(i,H);ctx.stroke();}
                    // Spikes below platform
                    ctx.fillStyle='#3a1500';
                    for(let i=0;i<W;i+=30){ ctx.beginPath();ctx.moveTo(i,H);ctx.lineTo(i+15,H-55);ctx.lineTo(i+30,H);ctx.fill(); }
                    // Spike tips
                    ctx.fillStyle='#662200';
                    for(let i=0;i<W;i+=30){ ctx.beginPath();ctx.moveTo(i+12,H-50);ctx.lineTo(i+15,H-68);ctx.lineTo(i+18,H-50);ctx.fill(); }
                }
            },
            thronekahn: {
                name: "KAHN'S THRONE",
                thumbGradient: ['#1a0000', '#2a0a00'],
                thumbAccent: '#cc0000',
                render: (ctx, W, H) => {
                    // Red/dark throne room
                    const sky = ctx.createLinearGradient(0,0,0,H);
                    sky.addColorStop(0,'#0f0000'); sky.addColorStop(0.6,'#200000'); sky.addColorStop(1,'#050000');
                    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
                    // Huge columns
                    ctx.fillStyle='#1a0800';
                    [[80,H-300,40,300],[220,H-280,35,280],[W-80-40,H-300,40,300],[W-220-35,H-280,35,280]].forEach(([x,y,w,h])=>{
                        ctx.fillRect(x,y,w,h);
                        // Column cap
                        ctx.fillStyle='#2a1200'; ctx.fillRect(x-8,y,w+16,20); ctx.fillStyle='#1a0800';
                    });
                    // Skull banners
                    [[160,80],[W-160,80]].forEach(([bx,by])=>{
                        ctx.fillStyle='#440000'; ctx.fillRect(bx-15,by,30,180);
                        ctx.fillStyle='#880000'; ctx.beginPath(); ctx.arc(bx,by+40,20,0,Math.PI*2); ctx.fill();
                        ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(bx-6,by+35,4,0,Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(bx+6,by+35,4,0,Math.PI*2); ctx.fill();
                    });
                    // Throne (background)
                    ctx.fillStyle='#300000'; ctx.fillRect(W/2-80,H-350,160,250);
                    ctx.fillStyle='#500000'; ctx.fillRect(W/2-60,H-320,120,80);
                    // Ground
                    const gnd=ctx.createLinearGradient(0,H-100,0,H);
                    gnd.addColorStop(0,'#1a0500'); gnd.addColorStop(1,'#050000');
                    ctx.fillStyle=gnd; ctx.fillRect(0,H-100,W,120);
                    // Ground tiles
                    ctx.strokeStyle='rgba(80,10,10,0.5)'; ctx.lineWidth=1;
                    for(let i=0;i<W;i+=80){ctx.beginPath();ctx.moveTo(i,H-100);ctx.lineTo(i,H);ctx.stroke();}
                    for(let i=H-100;i<H;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i);ctx.stroke();}
                    // Lava cracks in ground
                    ctx.strokeStyle='rgba(255,80,0,0.3)'; ctx.lineWidth=2;
                    [[200,H-80,400,H-60],[600,H-90,900,H-70],[100,H-50,300,H-40]].forEach(([x1,y1,x2,y2])=>{
                        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
                    });
                    // Red torch glow on ceiling
                    ctx.fillStyle='rgba(255,0,0,0.04)';
                    ctx.fillRect(0,0,W,200);
                }
            },
            deadpool: {
                name: 'DEAD POOL',
                thumbGradient: ['#001a10', '#000d08'],
                thumbAccent: '#00ff88',
                render: (ctx, W, H) => {
                    // Green acid pool chamber
                    const sky=ctx.createLinearGradient(0,0,0,H);
                    sky.addColorStop(0,'#000a05'); sky.addColorStop(0.5,'#001208'); sky.addColorStop(1,'#000500');
                    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
                    // Acid pool below (visible below platform)
                    const pool=ctx.createLinearGradient(0,H-60,0,H);
                    pool.addColorStop(0,'rgba(0,255,100,0.6)'); pool.addColorStop(1,'rgba(0,180,60,0.8)');
                    ctx.fillStyle=pool; ctx.fillRect(0,H-60,W,80);
                    // Acid glow on platform underside
                    ctx.fillStyle='rgba(0,255,100,0.05)'; ctx.fillRect(0,H-120,W,60);
                    // Cave stalactites
                    ctx.fillStyle='#021008';
                    for(let i=0;i<W;i+=70){const h=40+Math.sin(i*0.1)*20; ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+35,h);ctx.lineTo(i+70,0);ctx.fill();}
                    // Stone chains
                    [[200,0,200,250],[W-200,0,W-200,250]].forEach(([x1,y1,x2,y2])=>{
                        ctx.strokeStyle='#1a2a1a'; ctx.lineWidth=6;
                        for(let y=y1;y<y2;y+=20){ctx.beginPath();ctx.arc(x1,y+10,8,0,Math.PI*2);ctx.stroke();}
                    });
                    // Platform
                    const plat=ctx.createLinearGradient(0,H-100,0,H-60);
                    plat.addColorStop(0,'#0a1a0a'); plat.addColorStop(1,'#050d05');
                    ctx.fillStyle=plat; ctx.fillRect(0,H-100,W,50);
                    // Platform edge glow from acid
                    ctx.fillStyle='rgba(0,255,80,0.15)'; ctx.fillRect(0,H-105,W,8);
                    // Acid bubbles
                    ctx.fillStyle='rgba(0,255,100,0.4)';
                    [[150,H-55,6],[400,H-50,4],[750,H-58,7],[1050,H-52,5],[900,H-54,3]].forEach(([bx,by,r])=>{
                        ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fill();
                    });
                    // Wall slime streaks
                    ctx.strokeStyle='rgba(0,200,60,0.2)'; ctx.lineWidth=3;
                    [[0,50,30,350],[W,80,W-20,400],[50,0,60,200],[W-50,0,W-70,180]].forEach(([x1,y1,x2,y2])=>{
                        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo((x1+x2)/2+20,
                        (y1+y2)/2,x2,y2); ctx.stroke();
                    });
                }
            },
            skytemple: {
                name: 'SKY TEMPLE',
                thumbGradient: ['#000a1a', '#001030'],
                thumbAccent: '#4488ff',
                render: (ctx, W, H) => {
                    // High altitude temple, purple/blue sky with storm
                    const sky=ctx.createLinearGradient(0,0,0,H);
                    sky.addColorStop(0,'#02040e'); sky.addColorStop(0.4,'#080520'); sky.addColorStop(1,'#000005');
                    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
                    // Stars
                    ctx.fillStyle='rgba(200,220,255,0.8)';
                    [[50,30],[200,80],[400,25],[700,60],[1000,40],[1150,90],[900,20],[300,100],[600,15]].forEach(([sx,sy])=>{
                        ctx.beginPath();ctx.arc(sx,sy,1.5,0,Math.PI*2);ctx.fill();
                    });
                    // Lightning flash in clouds
                    ctx.fillStyle='rgba(80,100,255,0.06)'; ctx.fillRect(0,0,W,200);
                    // Storm clouds
                    ctx.fillStyle='rgba(20,15,40,0.7)';
                    [[100,60,180,60],[400,40,200,50],[800,50,220,55],[1100,70,160,45]].forEach(([cx,cy,cw,ch])=>{
                        ctx.beginPath(); ctx.ellipse(cx,cy,cw,ch,0,0,Math.PI*2); ctx.fill();
                    });
                    // Temple pillars in background
                    ctx.fillStyle='rgba(20,20,60,0.8)';
                    [[W/2-200,H-400,50,300],[W/2-60,H-450,50,350],[W/2+120,H-400,50,300]].forEach(([px,py,pw,ph])=>{
                        ctx.fillRect(px,py,pw,ph);
                        ctx.fillStyle='rgba(30,30,80,0.8)'; ctx.fillRect(px-10,py,pw+20,20);
                        ctx.fillStyle='rgba(20,20,60,0.8)';
                    });
                    // Floating platform edge glow (electric)
                    const plat=ctx.createLinearGradient(0,H-100,0,H);
                    plat.addColorStop(0,'#0a0820'); plat.addColorStop(1,'#030310');
                    ctx.fillStyle=plat; ctx.fillRect(0,H-100,W,120);
                    // Electric edge
                    ctx.strokeStyle='rgba(100,150,255,0.6)'; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.moveTo(0,H-100); ctx.lineTo(W,H-100); ctx.stroke();
                    // Lightning bolt in sky
                    ctx.strokeStyle='rgba(180,200,255,0.7)'; ctx.lineWidth=3;
                    ctx.beginPath(); ctx.moveTo(600,30); ctx.lineTo(580,120); ctx.lineTo(610,120); ctx.lineTo(590,220); ctx.stroke();
                    ctx.strokeStyle='rgba(180,200,255,0.2)'; ctx.lineWidth=12;
                    ctx.beginPath(); ctx.moveTo(600,30); ctx.lineTo(580,120); ctx.lineTo(610,120); ctx.lineTo(590,220); ctx.stroke();
                }
            },
            livingforest: {
                name: 'LIVING FOREST',
                thumbGradient: ['#001a00', '#0a1500'],
                thumbAccent: '#44ff44',
                render: (ctx, W, H) => {
                    // Haunted living forest, green mist, skull-faced trees
                    const sky=ctx.createLinearGradient(0,0,0,H);
                    sky.addColorStop(0,'#010801'); sky.addColorStop(0.5,'#020f02'); sky.addColorStop(1,'#000200');
                    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
                    // Full moon through trees
                    ctx.fillStyle='rgba(200,255,180,0.07)'; ctx.beginPath(); ctx.arc(640,90,80,0,Math.PI*2); ctx.fill();
                    ctx.fillStyle='rgba(200,255,180,0.04)'; ctx.beginPath(); ctx.arc(640,90,120,0,Math.PI*2); ctx.fill();
                    // Background trees
                    ctx.fillStyle='#030d03';
                    for(let i=0;i<W;i+=90){
                        const th=200+Math.sin(i)*50;
                        ctx.fillRect(i+35,H-100-th,20,th+10);
                        // leafy top
                        ctx.beginPath();ctx.arc(i+45,H-100-th,35,0,Math.PI*2);ctx.fill();
                    }
                    // Face on one tree (centre)
                    const tx=W/2, ty=H-100-260;
                    ctx.fillStyle='#031503'; ctx.fillRect(tx-15,H-100-260,30,260);
                    ctx.fillStyle='rgba(0,80,0,0.7)'; ctx.beginPath();ctx.arc(tx,ty,50,0,Math.PI*2);ctx.fill();
                    // Eyes (skull-like)
                    ctx.fillStyle='rgba(0,255,0,0.5)';
                    ctx.beginPath();ctx.arc(tx-14,ty-5,7,0,Math.PI*2);ctx.fill();
                    ctx.beginPath();ctx.arc(tx+14,ty-5,7,0,Math.PI*2);ctx.fill();
                    // Mist
                    const mist=ctx.createLinearGradient(0,H-140,0,H-60);
                    mist.addColorStop(0,'rgba(0,60,0,0)'); mist.addColorStop(1,'rgba(0,100,20,0.35)');
                    ctx.fillStyle=mist; ctx.fillRect(0,H-140,W,100);
                    // Ground
                    const gnd=ctx.createLinearGradient(0,H-100,0,H);
                    gnd.addColorStop(0,'#091209'); gnd.addColorStop(1,'#020502');
                    ctx.fillStyle=gnd; ctx.fillRect(0,H-100,W,120);
                    // Root tendrils
                    ctx.strokeStyle='rgba(0,80,0,0.4)'; ctx.lineWidth=4;
                    [[W/2,H-100,W/2-80,H-75],[W/2,H-100,W/2+80,H-75],
                     [W/2-80,H-100,W/2-150,H-80],[W/2+80,H-100,W/2+150,H-80]].forEach(([x1,y1,x2,y2])=>{
                        ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo((x1+x2)/2,y1-10,x2,y2);ctx.stroke();
                    });
                }
            }
        };

        this.characters = {
            scorpion: { 
                color: '#ffcc00', name: 'SCORPION',
                // Scorpion: fast needle jab (tiny reach) + long chain-spear punch (huge reach)
                strikes: {
                    punchHigh:  { damage: 8,  reach: 10, duration: 80,  cooldown: 250, label: 'Quickjab',    hitboxH: 25, glowColor: 'rgba(255,200,0,0.6)' },
                    punchLow:   { damage: 10, reach: 30, duration: 100, cooldown: 300, label: 'TortureFist', hitboxH: 20, glowColor: 'rgba(255,160,0,0.6)' },
                    kickHigh:   { damage: 16, reach: 80, duration: 160, cooldown: 450, label: 'ChainWhip',   hitboxH: 35, glowColor: 'rgba(255,220,0,0.8)' },
                    kickLow:    { damage: 12, reach: 55, duration: 130, cooldown: 380, label: 'HellSweep',   hitboxH: 18, glowColor: 'rgba(200,100,0,0.7)' }
                }
            },
            subzero: { 
                color: '#33ccff', name: 'SUB-ZERO',
                // Sub-Zero: slow powerful ice punches + devastating wide freeze-kick
                strikes: {
                    punchHigh:  { damage: 14, reach: 40, duration: 160, cooldown: 500, label: 'IceFist',    hitboxH: 40, glowColor: 'rgba(100,200,255,0.7)' },
                    punchLow:   { damage: 11, reach: 20, duration: 120, cooldown: 380, label: 'FrostJab',   hitboxH: 20, glowColor: 'rgba(80,160,255,0.6)'  },
                    kickHigh:   { damage: 22, reach: 90, duration: 220, cooldown: 650, label: 'GlacierKick',hitboxH: 50, glowColor: 'rgba(0,180,255,0.9)'  },
                    kickLow:    { damage: 13, reach: 45, duration: 150, cooldown: 420, label: 'IceSweep',   hitboxH: 18, glowColor: 'rgba(60,140,255,0.7)' }
                }
            },
            liukang: { 
                color: '#ff3333', name: 'LIU KANG',
                // Liu Kang: ultra-fast bicycle kicks, builds rhythm — tiny fist but wide spinning kicks
                strikes: {
                    punchHigh:  { damage: 7,  reach: 25, duration: 70,  cooldown: 200, label: 'DragonJab',  hitboxH: 22, glowColor: 'rgba(255,80,0,0.5)'   },
                    punchLow:   { damage: 6,  reach: 15, duration: 60,  cooldown: 180, label: 'VenomFist',  hitboxH: 18, glowColor: 'rgba(255,30,30,0.5)'  },
                    kickHigh:   { damage: 18, reach: 70, duration: 140, cooldown: 350, label: 'BicycleKick',hitboxH: 45, glowColor: 'rgba(255,120,0,0.8)'  },
                    kickLow:    { damage: 12, reach: 50, duration: 110, cooldown: 300, label: 'DragonSweep',hitboxH: 15, glowColor: 'rgba(200,40,0,0.7)'   }
                }
            },
            reptile: { 
                color: '#22dd22', name: 'REPTILE',
                // Reptile: tiny venom spit fist + enormous tail sweep covering entire side
                strikes: {
                    punchHigh:  { damage: 9,  reach: 10, duration: 90,  cooldown: 270, label: 'VenomStrike', hitboxH: 20, glowColor: 'rgba(0,255,80,0.5)'  },
                    punchLow:   { damage: 8,  reach: 20, duration: 80,  cooldown: 250, label: 'ClawRake',    hitboxH: 15, glowColor: 'rgba(50,220,0,0.5)'  },
                    kickHigh:   { damage: 20, reach: 100,duration: 200, cooldown: 550, label: 'TailSweep',   hitboxH: 30, glowColor: 'rgba(0,200,50,0.9)'  },
                    kickLow:    { damage: 11, reach: 35, duration: 120, cooldown: 320, label: 'ScaleKick',   hitboxH: 14, glowColor: 'rgba(40,180,40,0.6)' }
                }
            },
            jax: { 
                color: '#888888', name: 'JAX',
                // Jax: short brutal grab/slam (very close range) + massive ground-pound shockwave
                strikes: {
                    punchHigh:  { damage: 22, reach: 35, duration: 220, cooldown: 650, label: 'PowerSlam',   hitboxH: 55, glowColor: 'rgba(200,150,80,0.8)' },
                    punchLow:   { damage: 18, reach: 25, duration: 190, cooldown: 580, label: 'GutPunch',     hitboxH: 40, glowColor: 'rgba(180,120,60,0.7)' },
                    kickHigh:   { damage: 26, reach: 60, duration: 260, cooldown: 700, label: 'QuakeStamp',   hitboxH: 60, glowColor: 'rgba(220,180,100,0.9)'},
                    kickLow:    { damage: 14, reach: 45, duration: 180, cooldown: 500, label: 'SteelSweep',   hitboxH: 20, glowColor: 'rgba(150,120,80,0.6)' }
                }
            },
            raiden: { 
                color: '#ffffff', name: 'RAIDEN',
                // Raiden: all long-range electric strikes, shortest is still 50px
                strikes: {
                    punchHigh:  { damage: 14, reach: 65, duration: 150, cooldown: 420, label: 'ThunderFist', hitboxH: 45, glowColor: 'rgba(150,220,255,0.8)' },
                    punchLow:   { damage: 11, reach: 50, duration: 130, cooldown: 400, label: 'ShockJab',    hitboxH: 30, glowColor: 'rgba(100,180,255,0.7)' },
                    kickHigh:   { damage: 18, reach: 100,duration: 200, cooldown: 550, label: 'LightningKick',hitboxH: 55, glowColor: 'rgba(200,240,255,0.9)'},
                    kickLow:    { damage: 13, reach: 75, duration: 170, cooldown: 470, label: 'StormSweep',  hitboxH: 20, glowColor: 'rgba(120,200,255,0.7)' }
                }
            }
        };

        this.init();
    }

    init() {
        console.log("Game Initialized");
        this.setupSelectionListeners();
        this.setupMapUI();
        this.animate();
    }

    setupSelectionListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'selection') return;

            // Player 1 cycle fighters: A/D
            if (e.code === 'KeyD' || e.code === 'KeyS') this.cycleSelection('p1', 1);
            if (e.code === 'KeyA' || e.code === 'KeyW') this.cycleSelection('p1', -1);

            // Player 2 cycle fighters: arrow left/right
            if (e.code === 'ArrowRight' || e.code === 'KeyL') this.cycleSelection('p2', 1);
            if (e.code === 'ArrowLeft' || e.code === 'Quote') this.cycleSelection('p2', -1);

            // Player 1 cycle maps: E / R
            if (e.code === 'KeyE') this.cycleMap(1);
            if (e.code === 'KeyR') this.cycleMap(-1);

            // Player 2 cycle maps: Up / Down arrows
            if (e.code === 'ArrowUp') this.cycleMap(1);
            if (e.code === 'ArrowDown') this.cycleMap(-1);

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

    cycleMap(dir) {
        const mapKeys = Object.keys(this.maps);
        let idx = mapKeys.indexOf(this.mapChoice);
        idx = (idx + dir + mapKeys.length) % mapKeys.length;
        this.mapChoice = mapKeys[idx];
        this.updateMapUI();
    }

    setupMapUI() {
        const grid = document.getElementById('map-grid');
        if (!grid) return;
        grid.innerHTML = '';

        // Build mini-canvas thumbnails for each map
        Object.entries(this.maps).forEach(([key, mapData]) => {
            const slot = document.createElement('div');
            slot.className = 'map-slot' + (key === this.mapChoice ? ' active-map' : '');
            slot.dataset.map = key;

            // Mini canvas thumbnail
            const mini = document.createElement('canvas');
            mini.width = 120; mini.height = 68;
            mini.style.width = '100%'; mini.style.height = '100%';
            const mctx = mini.getContext('2d');
            // Scale down the full render into 120x68
            mctx.scale(120/1280, 68/720);
            mapData.render(mctx, 1280, 720);
            mctx.setTransform(1,0,0,1,0,0);

            const lbl = document.createElement('div');
            lbl.className = 'map-slot-label';
            lbl.textContent = mapData.name;

            slot.appendChild(mini);
            slot.appendChild(lbl);

            // Click to select
            slot.addEventListener('click', () => {
                this.mapChoice = key;
                this.updateMapUI();
            });

            grid.appendChild(slot);
        });

        this.updateMapUI();
    }

    updateMapUI() {
        document.querySelectorAll('.map-slot').forEach(slot => {
            slot.classList.toggle('active-map', slot.dataset.map === this.mapChoice);
        });
        const nameEl = document.getElementById('map-name-display');
        if (nameEl) nameEl.textContent = this.maps[this.mapChoice]?.name || '';
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
                block: 'KeyQ'  // Q = block for P1
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
                block: 'BracketLeft',  // [ = block for P2
                special1: 'KeyO',
                special2: 'KeyI'
            },
            sounds: this.sounds,
            game: this
        });

        // Add P1 special keys (E and R now used for map cycling in selection; in fight they trigger specials)
        this.player1.controls.special1 = 'KeyE';
        this.player1.controls.special2 = 'BracketRight'; // ] for P1 special2

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
            announce.innerText = `${this.player1.name} WINS`;
            announce.style.textShadow = `0 0 20px ${this.characters[this.p1Choice].color}`;
        } else {
            announce.innerText = `${this.player2.name} WINS`;
            announce.style.textShadow = `0 0 20px ${this.characters[this.p2Choice].color}`;
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

        // Draw selected stage background
        this.drawStage();

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

    drawStage() {
        const mapData = this.maps[this.mapChoice];
        if (mapData) {
            mapData.render(this.ctx, this.canvas.width, this.canvas.height);
        }
        // Reset line width after stage render
        this.ctx.lineWidth = 1;
    }
}

const game = new Game();
