// Horror-The-Game: Part 1 v2.3 - Fixed Loading Screen
class Game {
    constructor() {
        this.scene = null; this.camera = null; this.renderer = null;
        this.player = null; this.enemies = []; this.items = []; this.doors = {};
        this.puzzles = []; this.checkpoints = []; this.currentCheckpoint = 0;
        this.isGameActive = false; this.isPaused = false;
        this.gameTime = 0; this.playTime = 0;
        this.input = { keys: {}, mouse: { x: 0, y: 0 } };
        this.pointerLocked = false;
        this.ambientDrone = null;
        this.lastTime = performance.now();
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        puzzleManager = new PuzzleManager(this);
        storyManager = new StoryManager(this);
        jumpScareManager = new JumpScareManager(this);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(GAME_CONFIG.fogColor);
        if (GAME_CONFIG.fogEnabled) this.scene.fog = new THREE.FogExp2(GAME_CONFIG.fogColor, GAME_CONFIG.fogDensity);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = GAME_CONFIG.shadowEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.setupLighting();
        this.loadLevel1();
        this.animate();
        // Hide loading screen immediately, show main menu
        setTimeout(() => {
            document.getElementById('loading-screen').hidden = true;
            document.getElementById('main-menu').hidden = false;
        }, 500);
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x222222, 0.25);
        this.scene.add(ambient);
        this.ambientDrone = audioManager.playAmbientDrone();
    }
    
    loadLevel1() {
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.items.forEach(i => this.scene.remove(i.mesh));
        this.enemies = []; this.items = [];
        this.createLaboratory();
        this.player = new Player(this.scene, 0, 0);
        this.camera.position.copy(this.player.mesh.position);
        this.createEnemies();
        this.createItems();
        this.createPuzzles();
        this.checkpoints = [
            { x: 0, y: 1.7, z: 0 },
            { x: 0, y: 1.7, z: -40 },
            { x: 30, y: 1.7, z: -40 },
            { x: 30, y: 1.7, z: -80 },
            { x: -30, y: 1.7, z: -80 },
            { x: 0, y: 1.7, z: -100 }
        ];
        storyManager.startChapter(1);
    }
    
    createLaboratory() {
        const floorGeo = new THREE.PlaneGeometry(200, 200);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85, metalness: 0.15 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
        this.scene.add(floor);
        const ceiling = new THREE.Mesh(floorGeo, floorMat);
        ceiling.rotation.x = Math.PI / 2; ceiling.position.y = 6;
        this.scene.add(ceiling);
        this.createWalls();
        this.createProps();
        this.createFlickeringLights();
    }
    
    createWalls() {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
        const positions = [
            { x: -100, z: 0, w: 2, h: 6, d: 200 },
            { x: 100, z: 0, w: 2, h: 6, d: 200 },
            { x: 0, z: -100, w: 200, h: 6, d: 2 },
            { x: 0, z: 100, w: 200, h: 6, d: 2 }
        ];
        positions.forEach(pos => {
            const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(pos.x, 3, pos.z);
            wall.receiveShadow = true;
            this.scene.add(wall);
        });
        const interior = [
            { x: -20, z: -20, w: 2, h: 6, d: 40 },
            { x: 20, z: -20, w: 2, h: 6, d: 40 },
            { x: -60, z: -50, w: 80, h: 6, d: 2 },
            { x: 60, z: -70, w: 80, h: 6, d: 2 },
            { x: -40, z: -80, w: 2, h: 6, d: 40 },
            { x: 40, z: -80, w: 2, h: 6, d: 40 }
        ];
        interior.forEach(pos => {
            const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(pos.x, 3, pos.z);
            wall.receiveShadow = true;
            this.scene.add(wall);
        });
    }
    
    createProps() {
        const propMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        for (let i = 0; i < 16; i++) {
            const tableGeo = new THREE.BoxGeometry(2.5, 1.2, 1.2);
            const table = new THREE.Mesh(tableGeo, propMat);
            table.position.set(-60 + i * 10, 0.6, -30 + (i % 3) * 25);
            table.castShadow = true;
            this.scene.add(table);
        }
        for (let i = 0; i < 12; i++) {
            const cabGeo = new THREE.BoxGeometry(1.8, 2.8, 1.2);
            const cabinet = new THREE.Mesh(cabGeo, propMat);
            cabinet.position.set(-98, 1.4, -80 + i * 15);
            cabinet.castShadow = true;
            this.scene.add(cabinet);
        }
    }
    
    createFlickeringLights() {
        const positions = [
            { x: 0, z: -20 }, { x: 0, z: -60 }, { x: -40, z: -40 },
            { x: 40, z: -40 }, { x: 0, z: -90 }, { x: -60, z: -70 }, { x: 60, z: -70 }
        ];
        positions.forEach((pos, i) => {
            const light = new THREE.PointLight(0xffaa00, 1.5, 20);
            light.position.set(pos.x, 5, pos.z);
            light.castShadow = true;
            this.scene.add(light);
            setInterval(() => { if (Math.random() > 0.65) light.intensity = 0.5 + Math.random() * 0.8; }, 150 + i * 40);
        });
    }
    
    createEnemies() {
        const enemy1 = new Enemy(this.scene, 0, -30, 'basic', [{ x: 0, z: -20 }, { x: 0, z: -40 }]);
        this.enemies.push(enemy1);
        const enemy2 = new Enemy(this.scene, 30, -50, 'fast', [{ x: 25, z: -45 }, { x: 35, z: -55 }]);
        this.enemies.push(enemy2);
        const enemy3 = new Enemy(this.scene, -30, -70, 'tank', [{ x: -35, z: -65 }, { x: -25, z: -75 }]);
        this.enemies.push(enemy3);
        const enemy4 = new Enemy(this.scene, 60, -85, 'stealth', [{ x: 55, z: -80 }, { x: 65, z: -90 }]);
        enemy4.deactivate();
        this.enemies.push(enemy4);
        const enemy5 = new Enemy(this.scene, 0, -95, 'boss', [{ x: -10, z: -90 }, { x: 10, z: -100 }]);
        enemy5.deactivate();
        this.enemies.push(enemy5);
    }
    
    createItems() {
        const items = [
            { x: -30, y: 1, z: -30, type: 'keycard', name: 'Lab Keycard', icon: '🔑' },
            { x: 30, y: 1, z: -50, type: 'battery', name: 'Battery Pack', icon: '🔋' },
            { x: -40, y: 1, z: -70, type: 'fuse', name: 'Electrical Fuse', icon: '⚡' },
            { x: 0, y: 1, z: -20, type: 'medkit', name: 'Medkit', icon: '💊' },
            { x: 30, y: 1, z: -65, type: 'medkit', name: 'Medkit', icon: '💊' },
            { x: -60, y: 1, z: -80, type: 'sanity_potion', name: 'Sanity Potion', icon: '🧪' },
            { x: 60, y: 1, z: -90, type: 'sanity_potion', name: 'Sanity Potion', icon: '🧪' },
            { x: 0, y: 1, z: -95, type: 'keycard', name: 'Exit Keycard', icon: '🔑' }
        ];
        items.forEach(d => { this.items.push(new Item(this.scene, d.x, d.y, d.z, d.type, d.name, d.icon)); });
    }
    
    createPuzzles() {
        const keypad1 = puzzleManager.createKeypadPuzzle(-20, 2, -20, '7391', 'door_main');
        this.puzzles.push(keypad1);
        const color1 = puzzleManager.createColorPuzzle(30, 2, -60, ['red', 'blue', 'green'], 'door_lab');
        this.puzzles.push(color1);
        const keypad2 = puzzleManager.createKeypadPuzzle(-40, 2, -80, '2468', 'door_storage');
        this.puzzles.push(keypad2);
        const collection1 = puzzleManager.createCollectionPuzzle(['keycard', 'battery', 'fuse'], 'door_exit', 'Need keycard, battery, fuse');
        this.puzzles.push(collection1);
        this.createDoors();
    }
    
    createDoors() {
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x553333 });
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 0.4), doorMat);
        d1.position.set(-20, 2.25, -20); this.scene.add(d1); this.doors['door_main'] = { mesh: d1, open: false, initialX: -20 };
        const d2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 0.4), doorMat);
        d2.position.set(30, 2.25, -60); this.scene.add(d2); this.doors['door_lab'] = { mesh: d2, open: false, initialX: 30 };
        const d3 = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 0.4), doorMat);
        d3.position.set(-40, 2.25, -80); this.scene.add(d3); this.doors['door_storage'] = { mesh: d3, open: false, initialX: -40 };
        const d4 = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 0.4), doorMat);
        d4.position.set(0, 2.25, -105); this.scene.add(d4); this.doors['door_exit'] = { mesh: d4, open: false, initialY: 2.25 };
    }
    
    openDoor(doorId) {
        const door = this.doors[doorId];
        if (!door || door.open) return;
        door.open = true;
        audioManager.playDoorOpen();
        const interval = setInterval(() => {
            if (doorId === 'door_exit') {
                door.mesh.position.y += 0.12;
                if (door.mesh.position.y >= door.initialY + 3.5) clearInterval(interval);
            } else {
                door.mesh.position.x += 0.12;
                if (door.mesh.position.x >= door.initialX + 2.5) clearInterval(interval);
            }
        }, 16);
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', e => {
            this.input.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape' && this.isGameActive) this.togglePause();
            if (e.key === 'e' || e.key === 'E') this.tryInteract();
            if (e.key === 'Shift' && this.player) this.player.isSprinting = true;
        });
        window.addEventListener('keyup', e => {
            this.input.keys[e.key.toLowerCase()] = false;
            if (e.key === 'Shift' && this.player) this.player.isSprinting = false;
        });
        document.addEventListener('click', () => { if (this.isGameActive && !this.isPaused) document.getElementById('game-canvas').requestPointerLock(); });
        document.addEventListener('pointerlockchange', () => { this.pointerLocked = document.pointerLockElement === document.getElementById('game-canvas'); });
        document.addEventListener('mousemove', e => {
            if (this.pointerLocked && this.isGameActive && !this.isPaused) {
                this.camera.rotation.y -= e.movementX * 0.002;
                this.camera.rotation.x -= e.movementY * 0.002;
                this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
            }
        });
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
        document.getElementById('btn-signin').addEventListener('click', () => firebaseAuth.signInWithGoogle());
        document.getElementById('btn-signout').addEventListener('click', () => firebaseAuth.signOut());
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-main-menu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-respawn').addEventListener('click', () => this.respawn());
        document.getElementById('btn-death-menu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-victory-menu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-settings').addEventListener('click', () => { document.getElementById('settings-modal').hidden = false; });
        document.getElementById('btn-settings-close').addEventListener('click', () => { document.getElementById('settings-modal').hidden = true; });
        document.getElementById('btn-credits').addEventListener('click', () => { document.getElementById('credits-modal').hidden = false; });
        document.getElementById('btn-credits-close').addEventListener('click', () => { document.getElementById('credits-modal').hidden = true; });
        document.getElementById('volume-master').addEventListener('input', e => audioManager.setMasterVolume(e.target.value / 100));
        setTimeout(() => { document.getElementById('btn-continue').disabled = !SaveSystem.hasSave(); }, 100);
    }
    
    startNewGame() {
        document.getElementById('main-menu').hidden = true;
        document.getElementById('game-container').hidden = false;
        this.gameTime = 0; this.playTime = 0;
        this.loadLevel1();
        this.camera.position.copy(this.player.mesh.position);
        this.isGameActive = true; this.isPaused = false;
        SaveSystem.startAutoSave(this);
        document.getElementById('game-canvas').requestPointerLock();
    }
    
    continueGame() {
        const result = SaveSystem.loadFromLocal();
        if (result.success) { this.startNewGame(); }
        else alert('No save found!');
    }
    
    getGameState() {
        return { playTime: this.playTime, chapter: storyManager.currentChapter, position: this.player.getPosition(), health: this.player.health, sanity: this.player.sanity, inventory: this.player.inventory, puzzles: puzzleManager.solvedPuzzles, storyFlags: storyManager.storyFlags, checkpoints: this.checkpoints, currentCheckpoint: this.currentCheckpoint };
    }
    
    saveGame() {
        const state = this.getGameState();
        if (firebaseAuth.currentUser) firebaseAuth.saveGame(state);
        else SaveSystem.saveToLocal(state);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-menu').hidden = !this.isPaused;
        if (this.isPaused) document.exitPointerLock();
        else document.getElementById('game-canvas').requestPointerLock();
    }
    
    showMainMenu() {
        this.isGameActive = false; this.isPaused = false;
        document.getElementById('pause-menu').hidden = true;
        document.getElementById('death-screen').hidden = true;
        document.getElementById('victory-screen').hidden = true;
        document.getElementById('game-container').hidden = true;
        document.getElementById('main-menu').hidden = false;
        document.exitPointerLock();
        SaveSystem.stopAutoSave();
    }
    
    tryInteract() {
        if (!this.isGameActive || this.isPaused) return;
        this.puzzles.forEach(puzzle => {
            if (!puzzleManager.solvedPuzzles[puzzle.id] && puzzleManager.checkPuzzle(puzzle, this.player)) {
                if (puzzle.type === 'keypad') puzzleManager.showKeypadUI(puzzle);
                else if (puzzle.type === 'color') puzzleManager.showColorUI(puzzle);
                else if (puzzle.type === 'collection' && puzzleManager.checkPuzzle(puzzle, this.player)) puzzleManager.solvePuzzle(puzzle);
            }
        });
        this.items.forEach(item => {
            if (!item.isCollected && this.player.mesh.position.distanceTo(item.mesh.position) < 2.5) {
                const collected = item.collect();
                if (collected.type === 'medkit') this.player.heal(50);
                else if (collected.type === 'sanity_potion') this.player.restoreSanity(40);
                else this.player.addToInventory(collected);
                audioManager.playPuzzleSolve();
            }
        });
    }
    
    getTensionLevel() {
        let tension = 1;
        const nearestEnemy = this.enemies.filter(e => e.isActive).reduce((min, e) => Math.min(min, this.player.mesh.position.distanceTo(e.mesh.position)), Infinity);
        if (nearestEnemy < 12) tension *= 1.6;
        if (nearestEnemy < 6) tension *= 1.7;
        if (this.player.health < 50) tension *= 1.4;
        if (this.player.sanity < 40) tension *= 1.5;
        return Math.min(tension, 3.5);
    }
    
    checkTriggers() {
        const pos = this.player.mesh.position;
        if (pos.z < -25 && !storyManager.storyFlags['enter_room_b']) storyManager.triggerEvent('enter_room_b');
        if (pos.z < -60 && pos.x > 20 && !storyManager.storyFlags['enter_main_lab']) { storyManager.triggerEvent('enter_main_lab'); if (this.enemies[3]) this.enemies[3].activate(); }
        if (pos.z < -85 && !storyManager.storyFlags['boss_area']) { storyManager.triggerEvent('boss_area'); if (this.enemies[4]) this.enemies[4].activate(); }
    }
    
    checkDeath() {
        if (this.player.isDead) { this.isGameActive = false; document.exitPointerLock(); document.getElementById('death-screen').hidden = false; }
    }
    
    checkVictory() {
        if (this.player.mesh.position.z < -107 && this.doors['door_exit'].open) { this.isGameActive = false; document.exitPointerLock(); document.getElementById('victory-screen').hidden = false; this.saveGame(); }
    }
    
    respawn() {
        const cp = this.checkpoints[this.currentCheckpoint] || this.checkpoints[0];
        this.player.health = GAME_CONFIG.checkpointRespawnHealth; this.player.sanity = GAME_CONFIG.checkpointRespawnSanity;
        this.player.setPosition(cp.x, cp.y, cp.z); this.camera.position.copy(this.player.mesh.position); this.player.isDead = false;
        document.getElementById('death-screen').hidden = true; document.getElementById('game-canvas').requestPointerLock(); this.isGameActive = true;
    }
    
    update(deltaTime) {
        if (!this.isGameActive || this.isPaused) return;
        this.gameTime += deltaTime; this.playTime += deltaTime;
        this.player.update(deltaTime, this.input, this.camera, this.enemies);
        this.camera.position.copy(this.player.mesh.position);
        this.enemies.forEach(enemy => enemy.update(deltaTime, this.player));
        this.items.forEach(item => item.update(deltaTime, this.gameTime));
        jumpScareManager.update(deltaTime);
        this.checkTriggers(); this.checkDeath(); this.checkVictory(); this.updateHUD();
    }
    
    updateHUD() {
        document.getElementById('health-fill').style.width = this.player.health + '%'; document.getElementById('health-text').textContent = Math.round(this.player.health) + '%';
        document.getElementById('stamina-fill').style.width = this.player.stamina + '%'; document.getElementById('stamina-text').textContent = Math.round(this.player.stamina) + '%';
        document.getElementById('sanity-fill').style.width = this.player.sanity + '%'; document.getElementById('sanity-text').textContent = 'SANITY: ' + Math.round(this.player.sanity) + '%';
        document.getElementById('objective-text').textContent = !this.doors['door_exit'].open ? 'Find keycard, battery, fuse to escape' : 'ESCAPE through the exit!';
        document.getElementById('blood-overlay').style.opacity = this.player.health < 40 ? (40 - this.player.health) / 100 : 0;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const now = performance.now(); const deltaTime = Math.min((now - this.lastTime) / 1000, 0.05); this.lastTime = now;
        this.update(deltaTime);
        if (this.scene && this.camera && this.renderer) this.renderer.render(this.scene, this.camera);
    }
}

// Start game on page load
window.addEventListener('load', () => { window.game = new Game(); });
