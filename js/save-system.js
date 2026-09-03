// Horror-The-Game: Part 1 - Save System

class SaveSystem {
    constructor() {
        this.saveKey = 'horrorGameSave';
        this.autoSaveTimer = null;
    }
    
    saveToLocal(gameState) {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                playTime: gameState.playTime || 0,
                chapter: gameState.chapter || 1,
                position: gameState.position || { x: 0, y: 0, z: 0 },
                rotation: gameState.rotation || { x: 0, y: 0 },
                health: gameState.health || 100,
                stamina: gameState.stamina || 100,
                inventory: gameState.inventory || [],
                puzzles: gameState.puzzles || {},
                storyFlags: gameState.storyFlags || {},
                checkpoints: gameState.checkpoints || [],
                currentCheckpoint: gameState.currentCheckpoint || 0,
                settings: gameState.settings || {
                    masterVolume: 0.8,
                    musicVolume: 0.6,
                    sfxVolume: 0.8,
                    graphicsQuality: 'medium'
                }
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('Game saved to localStorage');
            return { success: true, slot: 'local' };
        } catch (error) {
            console.error('Local save error:', error);
            return { success: false, error: error.message };
        }
    }
    
    loadFromLocal() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            
            if (!saveData) {
                return { success: false, error: 'No save found' };
            }
            
            const data = JSON.parse(saveData);
            console.log('Game loaded from localStorage');
            return {
                success: true,
                slot: 'local',
                data: data
            };
        } catch (error) {
            console.error('Local load error:', error);
            return { success: false, error: error.message };
        }
    }
    
    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }
    
    deleteSave() {
        localStorage.removeItem(this.saveKey);
        console.log('Local save deleted');
    }
    
    getSaveInfo() {
        const saveData = localStorage.getItem(this.saveKey);
        
        if (!saveData) return null;
        
        try {
            const data = JSON.parse(saveData);
            return {
                timestamp: data.timestamp,
                playTime: data.playTime || 0,
                chapter: data.chapter || 1,
                health: data.health || 100
            };
        } catch (error) {
            return null;
        }
    }
    
    startAutoSave(game) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (game && game.isGameActive) {
                this.saveToLocal(game.getGameState());
                console.log('Auto-saved');
            }
        }, GAME_CONFIG.autoSaveInterval);
    }
    
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
}

// Global instance
const SaveSystem = new SaveSystem();
