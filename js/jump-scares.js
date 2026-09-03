// Horror-The-Game: Part 1 - Jump Scare Manager

class JumpScareManager {
    constructor(game) {
        this.game = game;
        this.lastJumpScare = 0;
        this.minInterval = GAME_CONFIG.jumpScareMinInterval;
        this.maxInterval = GAME_CONFIG.jumpScareMaxInterval;
        this.nextJumpScareTime = this.minInterval;
        this.jumpScareActive = false;
        
        // Jump scare types
        this.jumpScares = [
            { id: 'face_1', duration: 800 },
            { id: 'face_2', duration: 600 },
            { id: 'face_3', duration: 1000 },
            { id: 'creature_1', duration: 700 },
            { id: 'static_1', duration: 500 }
        ];
        
        this.setupJumpScareImages();
    }
    
    setupJumpScareImages() {
        // Create procedural jump scare images using canvas
        this.jumpScareCanvases = {};
        
        // Jump scare face 1 (demon-like)
        this.jumpScareCanvases['face_1'] = this.createJumpScareCanvas(
            this.drawDemonFace.bind(this)
        );
        
        // Jump scare face 2 (zombie-like)
        this.jumpScareCanvases['face_2'] = this.createJumpScareCanvas(
            this.drawZombieFace.bind(this)
        );
        
        // Jump scare face 3 (distorted)
        this.jumpScareCanvases['face_3'] = this.createJumpScareCanvas(
            this.drawDistortedFace.bind(this)
        );
        
        // Creature
        this.jumpScareCanvases['creature_1'] = this.createJumpScareCanvas(
            this.drawCreature.bind(this)
        );
        
        // Static
        this.jumpScareCanvases['static_1'] = this.createJumpScareCanvas(
            this.drawStatic.bind(this)
        );
    }
    
    createJumpScareCanvas(drawFunction) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        drawFunction(ctx, 800, 600);
        
        return canvas.toDataURL('image/jpeg', 0.8);
    }
    
    drawDemonFace(ctx, w, h) {
        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        
        // Face outline
        ctx.fillStyle = '#2a0a0a';
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w/3, h/2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (glowing red)
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.ellipse(w/2 - 80, h/2 - 30, 50, 35, 0, 0, Math.PI * 2);
        ctx.ellipse(w/2 + 80, h/2 - 30, 50, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.ellipse(w/2 - 80, h/2 - 30, 20, 25, 0, 0, Math.PI * 2);
        ctx.ellipse(w/2 + 80, h/2 - 30, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (wide, toothy)
        ctx.fillStyle = '#1a0000';
        ctx.beginPath();
        ctx.ellipse(w/2, h/2 + 100, 120, 60, 0, 0, Math.PI, false);
        ctx.fill();
        
        // Teeth
        ctx.fillStyle = '#ffffee';
        for (let i = 0; i < 12; i++) {
            const x = w/2 - 100 + i * 17;
            ctx.beginPath();
            ctx.moveTo(x, h/2 + 50);
            ctx.lineTo(x + 8, h/2 + 80);
            ctx.lineTo(x + 17, h/2 + 50);
            ctx.fill();
        }
        
        // Horns
        ctx.fillStyle = '#3a0a0a';
        ctx.beginPath();
        ctx.moveTo(w/2 - 100, h/2 - 150);
        ctx.lineTo(w/2 - 150, h/2 - 280);
        ctx.lineTo(w/2 - 50, h/2 - 180);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(w/2 + 100, h/2 - 150);
        ctx.lineTo(w/2 + 150, h/2 - 280);
        ctx.lineTo(w/2 + 50, h/2 - 180);
        ctx.fill();
        
        // Blood drips
        ctx.fillStyle = '#8b0000';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h/2;
            const length = 30 + Math.random() * 80;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 5, y + length/2, x, y + length);
            ctx.quadraticCurveTo(x - 5, y + length/2, x, y);
            ctx.fill();
        }
    }
    
    drawZombieFace(ctx, w, h) {
        // Background
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, 0, w, h);
        
        // Face
        ctx.fillStyle = '#3a4a3a';
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w/3, h/2.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (white, empty)
        ctx.fillStyle = '#eeeeee';
        ctx.beginPath();
        ctx.ellipse(w/2 - 70, h/2 - 40, 40, 30, 0, 0, Math.PI * 2);
        ctx.ellipse(w/2 + 70, h/2 - 40, 40, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark circles
        ctx.fillStyle = '#1a2a1a';
        ctx.beginPath();
        ctx.ellipse(w/2 - 70, h/2 - 40, 50, 40, 0, 0, Math.PI * 2);
        ctx.ellipse(w/2 + 70, h/2 - 40, 50, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye holes
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.ellipse(w/2 - 70, h/2 - 40, 25, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(w/2 + 70, h/2 - 40, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose (decayed)
        ctx.fillStyle = '#2a3a2a';
        ctx.beginPath();
        ctx.moveTo(w/2, h/2);
        ctx.lineTo(w/2 - 30, h/2 + 50);
        ctx.lineTo(w/2 + 30, h/2 + 50);
        ctx.fill();
        
        // Mouth (rotting)
        ctx.fillStyle = '#1a0a0a';
        ctx.beginPath();
        ctx.ellipse(w/2, h/2 + 120, 80, 50, 0, 0, Math.PI, false);
        ctx.fill();
        
        // Broken teeth
        ctx.fillStyle = '#ccccaa';
        for (let i = 0; i < 8; i++) {
            const x = w/2 - 60 + i * 18;
            const height = 20 + Math.random() * 20;
            ctx.fillRect(x, h/2 + 75, 12, height);
        }
        
        // Wounds
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.ellipse(w/2 - 100, h/2 - 50, 30, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(w/2 + 120, h/2 + 20, 25, 15, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawDistortedFace(ctx, w, h) {
        // Background with noise
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);
        
        // Add static noise
        for (let i = 0; i < 10000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
        
        // Distorted face
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(w/2, h/2, w/3, h/2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glitchy eyes
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ff0000' : '#00ff00';
            const x = w/2 - 100 + Math.random() * 40;
            const y = h/2 - 50 + Math.random() * 30;
            ctx.fillRect(x, y, 60, 40);
        }
        
        // Distorted mouth
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(w/2 - 100, h/2 + 80);
        ctx.lineTo(w/2 - 50, h/2 + 150);
        ctx.lineTo(w/2, h/2 + 100);
        ctx.lineTo(w/2 + 50, h/2 + 150);
        ctx.lineTo(w/2 + 100, h/2 + 80);
        ctx.fill();
        
        // TV scan lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        for (let y = 0; y < h; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }
    
    drawCreature(ctx, w, h) {
        // Background
        ctx.fillStyle = '#0a0000';
        ctx.fillRect(0, 0, w, h);
        
        // Creature body (shadowy)
        ctx.fillStyle = '#1a0a0a';
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2 - 150, h);
        ctx.lineTo(w/2 + 150, h);
        ctx.fill();
        
        // Multiple eyes
        const eyePositions = [
            { x: w/2 - 80, y: h/3 },
            { x: w/2 + 80, y: h/3 },
            { x: w/2 - 120, y: h/2 },
            { x: w/2 + 120, y: h/2 },
            { x: w/2, y: h/2.5 }
        ];
        
        eyePositions.forEach(pos => {
            // Eye glow
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, 40, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupil
            ctx.fillStyle = '#000000';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, 15, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Claws/tentacles
        ctx.fillStyle = '#2a0a0a';
        for (let i = 0; i < 6; i++) {
            const x = w/2 - 200 + i * 80;
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.quadraticCurveTo(x + 20, h - 100, x, h - 200);
            ctx.quadraticCurveTo(x - 20, h - 100, x, h);
            ctx.fill();
        }
    }
    
    drawStatic(ctx, w, h) {
        // Full static noise
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                const brightness = Math.random() * 255;
                ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
                ctx.fillRect(x, y, 2, 2);
            }
        }
        
        // Occasional bright flashes
        if (Math.random() > 0.7) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(0, 0, w, h);
        }
    }
    
    triggerJumpScare() {
        if (this.jumpScareActive) return;
        
        this.jumpScareActive = true;
        this.lastJumpScare = Date.now();
        
        // Pick random jump scare
        const jumpScare = this.jumpScares[Math.floor(Math.random() * this.jumpScares.length)];
        const imageData = this.jumpScareCanvases[jumpScare.id];
        
        // Show overlay
        const overlay = document.getElementById('jump-scare-overlay');
        const img = document.getElementById('jump-scare-image');
        img.src = imageData;
        overlay.style.display = 'flex';
        
        // Play sound
        audioManager.playJumpScare();
        audioManager.playEnemyGrowl();
        
        // Screen shake effect
        document.body.style.animation = 'scareShake 0.5s ease-in-out';
        
        // Hide after duration
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.style.animation = '';
            this.jumpScareActive = false;
            
            // Schedule next jump scare
            this.nextJumpScareTime = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
        }, jumpScare.duration);
    }
    
    update(deltaTime) {
        if (this.jumpScareActive) return;
        
        const timeSinceLast = Date.now() - this.lastJumpScare;
        
        if (timeSinceLast > this.nextJumpScareTime) {
            // Chance to trigger based on game tension
            const tensionMultiplier = this.game.getTensionLevel();
            const triggerChance = 0.3 * tensionMultiplier;
            
            if (Math.random() < triggerChance) {
                this.triggerJumpScare();
            }
        }
    }
    
    reset() {
        this.lastJumpScare = 0;
        this.nextJumpScareTime = this.minInterval;
        this.jumpScareActive = false;
    }
}

// Global instance placeholder (created in game.js)
let jumpScareManager;
