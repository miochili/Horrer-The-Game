// Horror-The-Game: Part 1 - Main Game Engine

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.doors = {};
        this.puzzles = [];
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        
        this.isGameActive = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.playTime = 0;
        
        this.input = { keys: {}, mouse: { x: 0, y: 0 } };
        this.pointerLocked = false;
        
        this.ambientDrone = null;
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Initialize managers
        puzzleManager = new PuzzleManager(this);
        storyManager = new StoryManager(this);
        jumpScareManager = new JumpScareManager(this);
        
        // Create Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(GAME_CONFIG.fogColor);
        
        if (GAME_CONFIG.fogEnabled) {
            this.scene.fog = new THREE.FogExp2(GAME_CONFIG.fogColor, GAME_CONFIG.fogDensity);
        }
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('game-canvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = GAME_CONFIG.shadowEnabled;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        this.setupLighting();
        
        // Load level
        this.loadLevel1();
        
        // Start render loop
        this.lastTime = performance.now();
        this.animate();
    }
    
    setupLighting() {
        // Ambient light (very dim for horror atmosphere)
        const ambient = new THREE.AmbientLight(0x222222, 0.3);
        this.scene.add(ambient);
        
        // Start ambient drone sound
        this.ambientDrone = audioManager.playAmbientDrone();
    }
    
    loadLevel1() {
        // Clear existing
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.items.forEach(i => this.scene.remove(i.mesh));
        this.enemies = [];
        this.items = [];
        
        // Create laboratory environment
        this.createLaboratory();
        
        // Create player at start position
        this.player = new Player(this.scene, 0, 0);
        this.camera.position.copy(this.player.mesh.position);
        
        // Create enemies
        this.createEnemies();
        
        // Create items
        this.createItems();
        
        // Create puzzles
        this.createPuzzles();
        
        // Set checkpoints
        this.checkpoints = [
            { x: 0, y: 1.7, z: 0 },
            { x: 0, y: 1.7, z: -30 },
            { x: 20, y: 1.7, z: -30 },
            { x: 20, y: 1.7, z: -60 }
        ];
        
        // Start story
        storyManager.startChapter(1);
    }
    
    createLaboratory() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(100, 100);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceiling = new THREE.Mesh(floorGeo, floorMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 5;
        this.scene.add(ceiling);
        
        // Walls (procedural corridors and rooms)
        this.createWalls();
        
        // Props (tables, cabinets, etc.)
        this.createProps();
    }
    
    createWalls() {
        const wallMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.9
        });
        
        // Outer walls
        const wallPositions = [
            { x: -50, z: 0, w: 2, h: 5, d: 100, rot: 0 },
            { x: 50, z: 0, w: 2, h: 5, d: 100, rot: 0 },
            { x: 0, z: -50, w: 100, h: 5, d: 2, rot: 0 },
            { x: 0, z: 50, w: 100, h: 5, d: 2, rot: 0 }
        ];
        
        wallPositions.forEach(pos => {
            const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(pos.x, 2.5, pos.z);
            wall.rotation.y = pos.rot;
            wall.receiveShadow = true;
            this.scene.add(wall);
        });
        
        // Interior walls (corridors and rooms)
        const interiorWalls = [
            // Main corridor walls
            { x: -10, z: -15, w: 2, h: 5, d: 30 },
            { x: 10, z: -15, w: 2, h: 5, d: 30 },
            
            // Room dividers
            { x: -30, z: -30, w: 40, h: 5, d: 2 },
            { x: 30, z: -45, w: 40, h: 5, d: 2 },
            
            // Small rooms
            { x: -20, z: -50, w: 2, h: 5, d: 20 },
            { x: 20, z: -50, w: 2, h: 5, d: 20 }
        ];
        
        interiorWalls.forEach(pos => {
            const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const wall = new THREE.Mesh(geo, wallMat);
            wall.position.set(pos.x, 2.5, pos.z);
            wall.receiveShadow = true;
            this.scene.add(wall);
        });
    }
    
    createProps() {
        const propMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        
        // Tables
        for (let i = 0; i < 8; i++) {
            const tableGeo = new THREE.BoxGeometry(2, 1, 1);
            const table = new THREE.Mesh(tableGeo, propMat);
            table.position.set(-30 + i * 10, 0.5, -30 + (i % 2) * 20);
            table.castShadow = true;
            this.scene.add(table);
            
            // Table legs
            const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1);
            [-0.8, 0.8].forEach(x => {
                [-0.4, 0.4].forEach(z => {
                    const leg = new THREE.Mesh(legGeo, propMat);
                    leg.position.set(table.position.x + x, 0.5, table.position.z + z);
                    this.scene.add(leg);
                });
            });
        }
        
        // Cabinets
        for (let i = 0; i < 6; i++) {
            const cabGeo = new THREE.BoxGeometry(1.5, 2.5, 1);
            const cabinet = new THREE.Mesh(cabGeo, propMat);
            cabinet.position.set(-48, 1.25, -40 + i * 15);
            cabinet.castShadow = true;
            this.scene.add(cabinet);
        }
        
        // Pipes on ceiling
        const pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, 50);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8 });
        
        for (let i = 0; i < 5; i++) {
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.rotation.x = Math.PI / 2;
            pipe.position.set(-40 + i * 20, 4.5, 0);
            this.scene.add(pipe);
        }
        
        // Flickering lights
        this.createFlickeringLights();
    }
    
    createFlickeringLights() {
        const lightPositions = [
            { x: 0, z: -15 },
            { x: 0, z: -45 },
            { x: -20, z: -30 },
            { x: 20, z: -30 },
            { x: 0, z: -60 }
        ];
        
        lightPositions.forEach((pos, i) => {
            const light = new THREE.PointLight(0xffaa00, 1, 15);
            light.position.set(pos.x, 4, pos.z);
            light.castShadow = true;
            this.scene.add(light);
            
            // Flicker effect
            setInterval(() => {
                if (Math.random() > 0.7) {
                    light.intensity = 0.3 + Math.random() * 0.7;
                }
            }, 100 + i * 50);
        });
    }
    
    createEnemies() {
        // Enemy 1 - patrols main corridor
        const enemy1 = new Enemy(this.scene, 0, -25, [
            { x: 0, z: -15 },
            { x: 0, z: -35 }
        ]);
        this.enemies.push(enemy1);
        
        // Enemy 2 - guards the lab area
        const enemy2 = new Enemy(this.scene, 20, -50, [
            { x: 15, z: -45 },
            { x: 25, z: -45 },
            { x: 20, z: -55 }
        ]);
        this.enemies.push(enemy2);
        
        // Enemy 3 - stationary near exit (triggers later)
        const enemy3 = new Enemy(this.scene, 0, -70);
        enemy3.deactivate();
        this.enemies.push(enemy3);
    }
    
    createItems() {
        // Keycard (needed for first door)
        const keycard = new Item(this.scene, -30, 1, -30, 'keycard', 'Lab Keycard', '🔑');
        this.items.push(keycard);
        
        // Battery (for puzzle)
        const battery = new Item(this.scene, 20, 1, -40, 'battery', 'Battery Pack', '🔋');
        this.items.push(battery);
        
        // Fuse (for puzzle)
        const fuse = new Item(this.scene, -20, 1, -50, 'fuse', 'Electrical Fuse', '⚡');
        this.items.push(fuse);
        
        // Medkit (healing)
        const medkit1 = new Item(this.scene, 0, 1, -15, 'medkit', 'Medkit', '💊');
        this.items.push(medkit1);
        
        const medkit2 = new Item(this.scene, 20, 1, -55, 'medkit', 'Medkit', '💊');
        this.items.push(medkit2);
    }
    
    createPuzzles() {
        // Keypad puzzle for main door
        const keypad = puzzleManager.createKeypadPuzzle(-10, 1.5, -15, '7391', 'door_main');
        this.puzzles.push(keypad);
        
        // Color puzzle for lab door
        const colorPuzzle = puzzleManager.createColorPuzzle(20, 1.5, -60, ['red', 'blue', 'green'], 'door_lab');
        this.puzzles.push(colorPuzzle);
        
        // Collection puzzle for exit
        const exitPuzzle = puzzleManager.createCollectionPuzzle(
            ['keycard', 'battery', 'fuse'],
            'door_exit',
            'You need the keycard, battery, and fuse to power the exit door.'
        );
        this.puzzles.push(exitPuzzle);
        
        // Create doors
        this.createDoors();
    }
    
    createDoors() {
        // Main door (keypad)
        const door1Geo = new THREE.BoxGeometry(4, 4, 0.3);
        const door1Mat = new THREE.MeshStandardMaterial({ color: 0x663333 });
        const door1 = new THREE.Mesh(door1Geo, door1Mat);
        door1.position.set(-10, 2, -15);
        this.scene.add(door1);
        this.doors['door_main'] = { mesh: door1, open: false, initialX: -10 };
        
        // Lab door (color puzzle)
        const door2Geo = new THREE.BoxGeometry(4, 4, 0.3);
        const door2Mat = new THREE.MeshStandardMaterial({ color: 0x336633 });
        const door2 = new THREE.Mesh(door2Geo, door2Mat);
        door2.position.set(20, 2, -60);
        this.scene.add(door2);
        this.doors['door_lab'] = { mesh: door2, open: false, initialX: 20 };
        
        // Exit door (collection)
        const door3Geo = new THREE.BoxGeometry(4, 4, 0.3);
        const door3Mat = new THREE.MeshStandardMaterial({ color: 0x333366 });
        const door3 = new THREE.Mesh(door3Geo, door3Mat);
        door3.position.set(0, 2, -75);
        this.scene.add(door3);
        this.doors['door_exit'] = { mesh: door3, open: false, initialX: 0 };
    }
    
    openDoor(doorId) {
        const door = this.doors[doorId];
        if (!door || door.open) return;
        
        door.open = true;
        audioManager.playDoorOpen();
        
        // Animate door opening
        const isOpening = setInterval(() => {
            if (doorId === 'door_main' || doorId === 'door_lab') {
                door.mesh.position.x += 0.1;
                if (door.mesh.position.x >= door.initialX + 2) {
                    clearInterval(isOpening);
                }
            } else {
                door.mesh.position.y += 0.1;
                if (door.mesh.position.y >= door.initialX + 3) {
                    clearInterval(isOpening);
                }
            }
        }, 16);
    }
    
    setupEventListeners() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.input.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'Escape' && this.isGameActive) {
                this.togglePause();
            }
            
            if (e.key === 'e' || e.key === 'E') {
                this.tryInteract();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.input.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse input (pointer lock)
        document.addEventListener('click', () => {
            if (this.isGameActive && !this.isPaused) {
                document.getElementById('game-canvas').requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === document.getElementById('game-canvas');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.pointerLocked && this.isGameActive && !this.isPaused) {
                const sensitivity = 0.002;
                this.camera.rotation.y -= e.movementX * sensitivity;
                this.camera.rotation.x -= e.movementY * sensitivity;
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
            }
        });
        
        // Sprint
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Shift' && this.isGameActive) {
                this.player.isSprinting = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.player.isSprinting = false;
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Menu buttons
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
        document.getElementById('btn-load-game').addEventListener('click', () => this.loadGameFromMenu());
        document.getElementById('btn-signin').addEventListener('click', () => firebaseAuth.signInWithGoogle());
        document.getElementById('btn-signout').addEventListener('click', () => firebaseAuth.signOut());
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-main-menu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-respawn').addEventListener('click', () => this.respawn());
        document.getElementById('btn-death-menu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('btn-victory-menu').addEventListener('click', () => this.showMainMenu());
        
        // Settings
        document.getElementById('btn-settings').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'flex';
        });
        document.getElementById('btn-settings-pause').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'flex';
        });
        document.getElementById('btn-settings-close').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });
        
        document.getElementById('volume-master').addEventListener('input', (e) => {
            audioManager.setMasterVolume(e.target.value / 100);
        });
        document.getElementById('volume-music').addEventListener('input', (e) => {
            audioManager.setMusicVolume(e.target.value / 100);
        });
        document.getElementById('volume-sfx').addEventListener('input', (e) => {
            audioManager.setSFXVolume(e.target.value / 100);
        });
        
        // Credits
        document.getElementById('btn-credits').addEventListener('click', () => {
            document.getElementById('credits-modal').style.display = 'flex';
        });
        document.getElementById('btn-credits-close').addEventListener('click', () => {
            document.getElementById('credits-modal').style.display = 'none';
        });
        
        // Check for existing save on load
        setTimeout(() => {
            const hasSave = SaveSystem.hasSave();
            document.getElementById('btn-continue').disabled = !hasSave;
        }, 100);
    }
    
    startNewGame() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Reset game state
        this.gameTime = 0;
        this.playTime = 0;
        
        // Reload level
        this.loadLevel1();
        
        // Update camera
        this.camera.position.copy(this.player.mesh.position);
        this.camera.rotation.set(0, 0, 0);
        
        this.isGameActive = true;
        this.isPaused = false;
        
        // Start auto-save
        SaveSystem.startAutoSave(this);
        
        // Request pointer lock
        document.getElementById('game-canvas').requestPointerLock();
    }
    
    continueGame() {
        const result = SaveSystem.loadFromLocal();
        if (result.success) {
            this.loadGameState(result.data);
            this.startNewGame();
        } else {
            alert('No save found!');
        }
    }
    
    loadGameFromMenu() {
        const result = firebaseAuth.loadGame();
        if (result && result.success) {
            this.loadGameState(result.data);
            this.startNewGame();
        } else {
            alert('No save found!');
        }
    }
    
    loadGameState(state) {
        this.gameTime = state.playTime || 0;
        this.playTime = state.playTime || 0;
        
        // Load player
        if (this.player) {
            this.player.health = state.health || 100;
            this.player.inventory = state.inventory || [];
            this.player.updateInventoryUI();
        }
        
        // Load position
        if (state.position && this.player) {
            this.player.setPosition(state.position.x, state.position.y, state.position.z);
            this.camera.position.copy(this.player.mesh.position);
        }
        
        // Load story
        if (state.storyFlags) {
            storyManager.loadGameState({
                chapter: state.chapter || 1,
                storyFlags: state.storyFlags
            });
        }
        
        // Load checkpoints
        if (state.checkpoints) {
            this.checkpoints = state.checkpoints;
            this.currentCheckpoint = state.currentCheckpoint || 0;
        }
    }
    
    getGameState() {
        return {
            playTime: this.playTime,
            chapter: storyManager.currentChapter,
            position: this.player.getPosition(),
            rotation: { x: this.camera.rotation.x, y: this.camera.rotation.y },
            health: this.player.health,
            stamina: this.player.stamina,
            inventory: this.player.inventory,
            puzzles: puzzleManager.solvedPuzzles,
            storyFlags: storyManager.storyFlags,
            checkpoints: this.checkpoints,
            currentCheckpoint: this.currentCheckpoint,
            settings: {
                masterVolume: audioManager.masterVolume,
                musicVolume: audioManager.musicVolume,
                sfxVolume: audioManager.sfxVolume
            }
        };
    }
    
    saveGame() {
        const state = this.getGameState();
        
        if (firebaseAuth.currentUser) {
            firebaseAuth.saveGame(state);
        } else {
            SaveSystem.saveToLocal(state);
        }
        
        // Show save confirmation
        const statusEl = document.getElementById('save-status');
        statusEl.textContent = 'Game saved!';
        statusEl.style.color = '#66ff66';
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            document.getElementById('pause-menu').style.display = 'flex';
            document.exitPointerLock();
        } else {
            document.getElementById('pause-menu').style.display = 'none';
            document.getElementById('game-canvas').requestPointerLock();
        }
    }
    
    showMainMenu() {
        this.isGameActive = false;
        this.isPaused = false;
        
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('death-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        
        document.exitPointerLock();
        
        // Stop auto-save
        SaveSystem.stopAutoSave();
        
        // Stop ambient drone
        if (this.ambientDrone) {
            this.ambientDrone.osc1.stop();
            this.ambientDrone.osc2.stop();
        }
    }
    
    tryInteract() {
        if (!this.isGameActive || this.isPaused) return;
        
        // Check puzzles
        this.puzzles.forEach(puzzle => {
            if (!puzzleManager.solvedPuzzles[puzzle.id] && puzzleManager.checkPuzzle(puzzle, this.player)) {
                if (puzzle.type === 'keypad') {
                    puzzleManager.showKeypadUI(puzzle);
                } else if (puzzle.type === 'color') {
                    puzzleManager.showColorUI(puzzle);
                } else if (puzzle.type === 'collection') {
                    if (puzzleManager.checkPuzzle(puzzle, this.player)) {
                        puzzleManager.solvePuzzle(puzzle);
                        storyManager.triggerEvent('exit_unlocked');
                    }
                }
            }
        });
        
        // Check items
        this.items.forEach(item => {
            if (!item.isCollected) {
                const dist = this.player.mesh.position.distanceTo(item.mesh.position);
                if (dist < 2) {
                    const collected = item.collect();
                    if (this.player.addToInventory(collected)) {
                        audioManager.playPuzzleSolve();
                        
                        // Trigger story events
                        if (collected.type === 'keycard') {
                            storyManager.triggerEvent('find_keycard');
                        }
                    }
                }
            }
        });
        
        // Check medkits
        this.items.forEach(item => {
            if (!item.isCollected && item.type === 'medkit') {
                const dist = this.player.mesh.position.distanceTo(item.mesh.position);
                if (dist < 2) {
                    item.collect();
                    this.player.heal(50);
                    audioManager.playPuzzleSolve();
                }
            }
        });
    }
    
    showInteractionPrompt(text) {
        const prompt = document.getElementById('interaction-prompt');
        const textEl = document.getElementById('interaction-text');
        
        if (text) {
            textEl.textContent = text;
            prompt.style.display = 'block';
        } else {
            prompt.style.display = 'none';
        }
    }
    
    getTensionLevel() {
        // Calculate tension based on enemy proximity and health
        let tension = 1;
        
        const nearestEnemy = this.enemies
            .filter(e => e.isActive)
            .reduce((min, e) => {
                const dist = this.player.mesh.position.distanceTo(e.mesh.position);
                return dist < min ? dist : min;
            }, Infinity);
        
        if (nearestEnemy < 10) tension *= 1.5;
        if (nearestEnemy < 5) tension *= 1.5;
        if (this.player.health < 50) tension *= 1.3;
        
        return Math.min(tension, 3);
    }
    
    checkTriggers() {
        const pos = this.player.mesh.position;
        
        // Room B trigger
        if (pos.z < -20 && !storyManager.storyFlags['enter_room_b']) {
            storyManager.triggerEvent('enter_room_b');
        }
        
        // First enemy sighting
        this.enemies.forEach(enemy => {
            if (enemy.isActive && !storyManager.storyFlags['first_enemy_sighting']) {
                const dist = pos.distanceTo(enemy.mesh.position);
                if (dist < 8) {
                    storyManager.triggerEvent('first_enemy_sighting');
                }
            }
        });
        
        // Main lab
        if (pos.z < -50 && pos.x > 10 && !storyManager.storyFlags['enter_main_lab']) {
            storyManager.triggerEvent('enter_main_lab');
            // Activate third enemy
            if (this.enemies[2]) {
                this.enemies[2].activate();
            }
        }
        
        // Find logs (based on item collection)
        if (this.player.hasItem('battery') && !storyManager.storyFlags['find_log_1']) {
            storyManager.triggerEvent('find_log_1');
        }
        if (this.player.hasItem('fuse') && !storyManager.storyFlags['find_log_2']) {
            storyManager.triggerEvent('find_log_2');
        }
        if (pos.z < -60 && !storyManager.storyFlags['find_log_3']) {
            storyManager.triggerEvent('find_log_3');
        }
        
        // Reach exit
        if (pos.z < -70 && !storyManager.storyFlags['reach_exit']) {
            storyManager.triggerEvent('reach_exit');
        }
    }
    
    checkDeath() {
        if (this.player.isDead) {
            this.isGameActive = false;
            document.exitPointerLock();
            
            document.getElementById('death-screen').style.display = 'flex';
            document.getElementById('death-reason').textContent = 'The creature caught you...';
            
            audioManager.stopMusic();
        }
    }
    
    checkVictory() {
        const pos = this.player.mesh.position;
        
        if (pos.z < -76 && this.doors['door_exit'].open) {
            this.isGameActive = false;
            document.exitPointerLock();
            
            document.getElementById('victory-screen').style.display = 'flex';
            
            // Save completion
            this.saveGame();
        }
    }
    
    respawn() {
        const checkpoint = this.checkpoints[this.currentCheckpoint] || this.checkpoints[0];
        
        this.player.health = GAME_CONFIG.checkpointRespawnHealth;
        this.player.setPosition(checkpoint.x, checkpoint.y, checkpoint.z);
        this.camera.position.copy(this.player.mesh.position);
        this.player.isDead = false;
        
        document.getElementById('death-screen').style.display = 'none';
        document.getElementById('game-canvas').requestPointerLock();
        
        this.isGameActive = true;
    }
    
    update(deltaTime) {
        if (!this.isGameActive || this.isPaused) return;
        
        // Update timers
        this.gameTime += deltaTime;
        this.playTime += deltaTime;
        
        // Update player
        this.player.update(deltaTime, this.input, this.camera);
        
        // Update camera to follow player
        this.camera.position.copy(this.player.mesh.position);
        
        // Update enemies
        this.enemies.forEach(enemy => enemy.update(deltaTime, this.player));
        
        // Update items
        this.items.forEach(item => item.update(deltaTime, this.gameTime));
        
        // Update jump scares
        jumpScareManager.update(deltaTime);
        
        // Check triggers
        this.checkTriggers();
        
        // Check death/victory
        this.checkDeath();
        this.checkVictory();
        
        // Update HUD
        this.updateHUD();
    }
    
    updateHUD() {
        // Health
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        healthFill.style.width = this.player.health + '%';
        healthText.textContent = Math.round(this.player.health) + '%';
        
        // Stamina
        const staminaFill = document.getElementById('stamina-fill');
        const staminaText = document.getElementById('stamina-text');
        staminaFill.style.width = this.player.stamina + '%';
        staminaText.textContent = Math.round(this.player.stamina) + '%';
        
        // Objective
        const objectiveEl = document.getElementById('objective-text');
        if (!this.doors['door_exit'].open) {
            objectiveEl.textContent = 'Find keycard, battery, and fuse to escape';
        } else {
            objectiveEl.textContent = 'ESCAPE through the exit!';
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game
        this.update(deltaTime);
        
        // Render
        if (this.scene && this.camera && this.renderer) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});
