// Horror-The-Game: Part 1 - Firebase Authentication

class FirebaseAuth {
    constructor() {
        this.currentUser = null;
        this.authReady = false;
        
        if (typeof auth !== 'undefined') {
            this.setupAuthListener();
        }
    }
    
    setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.authReady = true;
            
            if (user) {
                console.log('User signed in:', user.email);
                this.updateUI();
                this.loadSaveStatus();
            } else {
                console.log('User signed out');
                this.updateUI();
            }
            
            // Trigger custom event for game to handle
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
        });
    }
    
    async signInWithGoogle() {
        if (!auth) {
            alert('Firebase is not configured. Please set up Firebase credentials in js/config.js');
            return null;
        }
        
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            this.currentUser = result.user;
            console.log('Signed in with Google:', this.currentUser.email);
            return this.currentUser;
        } catch (error) {
            console.error('Google sign-in error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('Popup closed by user');
            } else {
                alert('Sign-in failed: ' + error.message);
            }
            return null;
        }
    }
    
    async signOut() {
        if (!auth) return;
        
        try {
            await auth.signOut();
            this.currentUser = null;
            console.log('User signed out');
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }
    
    updateUI() {
        const authSection = document.getElementById('auth-section');
        const userInfo = document.getElementById('user-info');
        const btnSignin = document.getElementById('btn-signin');
        
        if (this.currentUser) {
            btnSignin.style.display = 'none';
            userInfo.style.display = 'flex';
            document.getElementById('user-name').textContent = this.currentUser.displayName || this.currentUser.email;
            document.getElementById('user-avatar').src = this.currentUser.photoURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiM0YThhZmYiLz48L3N2Zz4=';
        } else {
            btnSignin.style.display = 'inline-block';
            userInfo.style.display = 'none';
        }
    }
    
    async saveGame(gameState) {
        if (!this.currentUser || !db) {
            // Fallback to localStorage
            return SaveSystem.saveToLocal(gameState);
        }
        
        try {
            const saveData = {
                userId: this.currentUser.uid,
                timestamp: Date.now(),
                playTime: gameState.playTime || 0,
                chapter: gameState.chapter || 1,
                position: gameState.position || { x: 0, y: 0, z: 0 },
                health: gameState.health || 100,
                inventory: gameState.inventory || [],
                puzzles: gameState.puzzles || {},
                storyFlags: gameState.storyFlags || {},
                checkpoints: gameState.checkpoints || []
            };
            
            // Save to Firestore
            await db.collection('saves').doc(this.currentUser.uid).set(saveData, { merge: true });
            
            // Also save to localStorage as backup
            SaveSystem.saveToLocal(gameState);
            
            console.log('Game saved to Firebase');
            return { success: true, slot: 'cloud' };
        } catch (error) {
            console.error('Firebase save error:', error);
            // Fallback to localStorage
            return SaveSystem.saveToLocal(gameState);
        }
    }
    
    async loadGame() {
        if (!this.currentUser || !db) {
            // Fallback to localStorage
            return SaveSystem.loadFromLocal();
        }
        
        try {
            const doc = await db.collection('saves').doc(this.currentUser.uid).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log('Game loaded from Firebase');
                return {
                    success: true,
                    slot: 'cloud',
                    data: {
                        playTime: data.playTime || 0,
                        chapter: data.chapter || 1,
                        position: data.position || { x: 0, y: 0, z: 0 },
                        health: data.health || 100,
                        inventory: data.inventory || [],
                        puzzles: data.puzzles || {},
                        storyFlags: data.storyFlags || {},
                        checkpoints: data.checkpoints || []
                    }
                };
            } else {
                // No cloud save, try localStorage
                return SaveSystem.loadFromLocal();
            }
        } catch (error) {
            console.error('Firebase load error:', error);
            return SaveSystem.loadFromLocal();
        }
    }
    
    async loadSaveStatus() {
        const statusEl = document.getElementById('save-status');
        
        if (!this.currentUser || !db) {
            const hasLocalSave = localStorage.getItem('horrorGameSave') !== null;
            statusEl.textContent = hasLocalSave ? 'Local save available' : 'No save found';
            return hasLocalSave;
        }
        
        try {
            const doc = await db.collection('saves').doc(this.currentUser.uid).get();
            const hasCloudSave = doc.exists;
            const hasLocalSave = localStorage.getItem('horrorGameSave') !== null;
            
            if (hasCloudSave) {
                statusEl.textContent = 'Cloud save available';
                statusEl.style.color = '#4a8aff';
            } else if (hasLocalSave) {
                statusEl.textContent = 'Local save available';
                statusEl.style.color = '#ffcc00';
            } else {
                statusEl.textContent = 'No save found';
                statusEl.style.color = '#666';
            }
            
            return hasCloudSave || hasLocalSave;
        } catch (error) {
            console.error('Load status error:', error);
            statusEl.textContent = 'Error checking save status';
            return false;
        }
    }
    
    async deleteSave() {
        if (!this.currentUser || !db) {
            localStorage.removeItem('horrorGameSave');
            return;
        }
        
        try {
            await db.collection('saves').doc(this.currentUser.uid).delete();
            localStorage.removeItem('horrorGameSave');
            console.log('Save deleted');
        } catch (error) {
            console.error('Delete save error:', error);
        }
    }
}

// Global instance
const firebaseAuth = new FirebaseAuth();
