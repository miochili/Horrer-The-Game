// Horror-The-Game: Part 1 - Puzzle System

class PuzzleManager {
    constructor(game) {
        this.game = game;
        this.activePuzzle = null;
        this.solvedPuzzles = {};
    }
    
    // Keypad puzzle (4-digit code)
    createKeypadPuzzle(x, y, z, correctCode, doorId) {
        const puzzle = {
            id: 'keypad_' + doorId,
            type: 'keypad',
            position: new THREE.Vector3(x, y, z),
            correctCode: correctCode,
            doorId: doorId,
            currentInput: '',
            mesh: this.createKeypadMesh(x, y, z)
        };
        
        this.game.scene.add(puzzle.mesh);
        return puzzle;
    }
    
    createKeypadMesh(x, y, z) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Keypad base
        const baseGeo = new THREE.BoxGeometry(0.4, 0.5, 0.1);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        group.add(base);
        
        // Buttons (simplified visual)
        const buttonGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const buttonMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const button = new THREE.Mesh(buttonGeo, buttonMat);
                button.position.set((col - 1) * 0.12, 0.15 - row * 0.12, 0.06);
                group.add(button);
            }
        }
        
        // Display
        const displayGeo = new THREE.BoxGeometry(0.3, 0.1, 0.02);
        const displayMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x003300 });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, 0.2, 0.06);
        group.add(display);
        
        return group;
    }
    
    // Color sequence puzzle
    createColorPuzzle(x, y, z, sequence, doorId) {
        const puzzle = {
            id: 'color_' + doorId,
            type: 'color',
            position: new THREE.Vector3(x, y, z),
            sequence: sequence, // ['red', 'blue', 'green']
            currentInput: [],
            doorId: doorId,
            buttons: []
        };
        
        puzzle.mesh = this.createColorPuzzleMesh(x, y, z, puzzle.buttons);
        this.game.scene.add(puzzle.mesh);
        return puzzle;
    }
    
    createColorPuzzleMesh(x, y, z, buttons) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        const colors = [
            { name: 'red', color: 0xff0000 },
            { name: 'blue', color: 0x0066ff },
            { name: 'green', color: 0x00ff00 },
            { name: 'yellow', color: 0xffff00 }
        ];
        
        colors.forEach((c, i) => {
            const geo = new THREE.SphereGeometry(0.15, 16, 16);
            const mat = new THREE.MeshStandardMaterial({ 
                color: c.color,
                emissive: c.color,
                emissiveIntensity: 0.3
            });
            const button = new THREE.Mesh(geo, mat);
            button.position.set((i - 1.5) * 0.4, 0, 0);
            button.userData = { colorName: c.name };
            group.add(button);
            buttons.push(button);
        });
        
        return group;
    }
    
    // Item collection puzzle (find all items to unlock)
    createCollectionPuzzle(requiredItems, doorId, description) {
        return {
            id: 'collection_' + doorId,
            type: 'collection',
            requiredItems: requiredItems, // ['keycard', 'battery', 'fuse']
            doorId: doorId,
            description: description
        };
    }
    
    checkPuzzle(puzzle, player) {
        if (puzzle.type === 'keypad') {
            const dist = player.mesh.position.distanceTo(puzzle.position);
            return dist < 2;
        } else if (puzzle.type === 'color') {
            const dist = player.mesh.position.distanceTo(puzzle.position);
            return dist < 2;
        } else if (puzzle.type === 'collection') {
            const hasAll = puzzle.requiredItems.every(item => player.hasItem(item));
            return hasAll;
        }
        return false;
    }
    
    solvePuzzle(puzzle) {
        this.solvedPuzzles[puzzle.id] = true;
        audioManager.playPuzzleSolve();
        
        if (puzzle.doorId) {
            this.game.openDoor(puzzle.doorId);
        }
        
        return true;
    }
    
    showKeypadUI(puzzle) {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogueText = document.getElementById('dialogue-text');
        const nextBtn = document.getElementById('btn-dialogue-next');
        
        dialogueBox.style.display = 'block';
        dialogueText.innerHTML = `
            <div style="text-align:center;">
                <h3>Enter Code</h3>
                <div id="keypad-display" style="font-size:2rem; margin:20px; padding:10px; background:#222; border:2px solid #666; letter-spacing:10px;">_ _ _ _</div>
                <div id="keypad-buttons" style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; max-width:200px; margin:0 auto;">
                    <button class="keypad-btn" data-num="1">1</button>
                    <button class="keypad-btn" data-num="2">2</button>
                    <button class="keypad-btn" data-num="3">3</button>
                    <button class="keypad-btn" data-num="4">4</button>
                    <button class="keypad-btn" data-num="5">5</button>
                    <button class="keypad-btn" data-num="6">6</button>
                    <button class="keypad-btn" data-num="7">7</button>
                    <button class="keypad-btn" data-num="8">8</button>
                    <button class="keypad-btn" data-num="9">9</button>
                    <button class="keypad-btn" data-num="clear" style="color:#ff6666;">C</button>
                    <button class="keypad-btn" data-num="0">0</button>
                    <button class="keypad-btn" data-num="enter" style="color:#66ff66;">✓</button>
                </div>
            </div>
        `;
        
        nextBtn.style.display = 'none';
        
        puzzle.currentInput = '';
        
        // Add button handlers
        setTimeout(() => {
            const buttons = document.querySelectorAll('.keypad-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const num = btn.dataset.num;
                    
                    if (num === 'clear') {
                        puzzle.currentInput = '';
                    } else if (num === 'enter') {
                        if (puzzle.currentInput === puzzle.correctCode) {
                            this.solvePuzzle(puzzle);
                            dialogueBox.style.display = 'none';
                            this.game.showInteractionPrompt('');
                        } else {
                            document.getElementById('keypad-display').style.color = '#ff0000';
                            setTimeout(() => {
                                document.getElementById('keypad-display').style.color = '#00ff00';
                            }, 500);
                        }
                    } else {
                        if (puzzle.currentInput.length < 4) {
                            puzzle.currentInput += num;
                        }
                    }
                    
                    // Update display
                    let display = puzzle.currentInput.split('').join(' ');
                    while (display.length < 7) display += ' _';
                    document.getElementById('keypad-display').textContent = display;
                });
            });
        }, 100);
    }
    
    showColorUI(puzzle) {
        const dialogueBox = document.getElementById('dialogue-box');
        const dialogueText = document.getElementById('dialogue-text');
        const nextBtn = document.getElementById('btn-dialogue-next');
        
        dialogueBox.style.display = 'block';
        dialogueText.innerHTML = `
            <div style="text-align:center;">
                <h3>Press the buttons in the correct order</h3>
                <div id="color-sequence" style="font-size:1.5rem; margin:20px; padding:10px; background:#222; border:2px solid #666;">
                    ${puzzle.sequence.map(() => '? ').join('')}
                </div>
                <div id="color-buttons" style="display:flex; gap:20px; justify-content:center; margin-top:20px;">
                    <button class="color-btn" data-color="red" style="width:60px; height:60px; border-radius:50%; background:#ff0000; border:3px solid #fff;"></button>
                    <button class="color-btn" data-color="blue" style="width:60px; height:60px; border-radius:50%; background:#0066ff; border:3px solid #fff;"></button>
                    <button class="color-btn" data-color="green" style="width:60px; height:60px; border-radius:50%; background:#00ff00; border:3px solid #fff;"></button>
                    <button class="color-btn" data-color="yellow" style="width:60px; height:60px; border-radius:50%; background:#ffff00; border:3px solid #fff;"></button>
                </div>
                <button id="color-reset" style="margin-top:20px; padding:10px 20px; background:#666; color:#fff; border:none; cursor:pointer;">Reset</button>
            </div>
        `;
        
        nextBtn.style.display = 'none';
        
        puzzle.currentInput = [];
        
        setTimeout(() => {
            const buttons = document.querySelectorAll('.color-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const color = btn.dataset.color;
                    puzzle.currentInput.push(color);
                    
                    // Update display
                    const display = puzzle.currentInput.map(() => '● ').join('');
                    document.getElementById('color-sequence').textContent = display;
                    
                    // Check if sequence is complete
                    if (puzzle.currentInput.length === puzzle.sequence.length) {
                        const isCorrect = puzzle.currentInput.every((c, i) => c === puzzle.sequence[i]);
                        
                        if (isCorrect) {
                            this.solvePuzzle(puzzle);
                            dialogueBox.style.display = 'none';
                            this.game.showInteractionPrompt('');
                        } else {
                            document.getElementById('color-sequence').style.color = '#ff0000';
                            puzzle.currentInput = [];
                            setTimeout(() => {
                                document.getElementById('color-sequence').style.color = '#fff';
                                document.getElementById('color-sequence').textContent = puzzle.sequence.map(() => '? ').join('');
                            }, 1000);
                        }
                    }
                });
            });
            
            document.getElementById('color-reset').addEventListener('click', () => {
                puzzle.currentInput = [];
                document.getElementById('color-sequence').textContent = puzzle.sequence.map(() => '? ').join('');
            });
        }, 100);
    }
}

// Global instance placeholder (created in game.js)
let puzzleManager;
