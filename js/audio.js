// Horror-The-Game: Part 1 - Audio Manager

class AudioManager {
    constructor() {
        this.masterVolume = GAME_CONFIG.masterVolume;
        this.musicVolume = GAME_CONFIG.musicVolume;
        this.sfxVolume = GAME_CONFIG.sfxVolume;
        this.audioContext = null;
        this.buffers = {};
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        
        this.initAudio();
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.audioContext.destination);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.audioContext.destination);
            
            console.log('Audio system initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }
    
    async loadSound(name, url) {
        if (!this.audioContext) return;
        
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.buffers[name] = audioBuffer;
            console.log(`Loaded sound: ${name}`);
        } catch (error) {
            console.warn(`Failed to load sound ${name}:`, error);
        }
    }
    
    playSound(name, isMusic = false) {
        if (!this.audioContext || !this.buffers[name]) return null;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers[name];
        
        if (isMusic) {
            source.connect(this.musicGain);
            source.loop = true;
        } else {
            source.connect(this.sfxGain);
        }
        
        source.start(0);
        
        if (!isMusic) {
            // Auto-cleanup for SFX
            source.onended = () => {
                delete this.buffers[name + '_instance'];
            };
        }
        
        if (isMusic) {
            this.currentMusic = source;
        }
        
        return source;
    }
    
    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentMusic = null;
        }
    }
    
    setMasterVolume(value) {
        this.masterVolume = value;
        if (this.audioContext) {
            this.audioContext.destination.gain.value = value;
        }
    }
    
    setMusicVolume(value) {
        this.musicVolume = value;
        if (this.musicGain) {
            this.musicGain.gain.value = value;
        }
    }
    
    setSFXVolume(value) {
        this.sfxVolume = value;
        if (this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    }
    
    // Procedural sound effects (no external files needed)
    playHeartbeat() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.value = 60;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }
    
    playJumpScare() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
        osc.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
    
    playFootstep() {
        if (!this.audioContext) return;
        
        const noise = this.createNoise(0.05);
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.1);
    }
    
    playDoorOpen() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
        osc.type = 'square';
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }
    
    playPuzzleSolve() {
        if (!this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
        });
    }
    
    playEnemyGrowl() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.5);
        osc.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
    
    playDamage() {
        if (!this.audioContext) return;
        
        const noise = this.createNoise(0.2);
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.3);
    }
    
    createNoise(duration) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        return noise;
    }
    
    // Ambient drone for atmosphere
    playAmbientDrone() {
        if (!this.audioContext) return null;
        
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc1.frequency.value = 50;
        osc2.frequency.value = 52; // Slight detune for beating effect
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        gain.gain.value = 0.15;
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.musicGain);
        
        osc1.start();
        osc2.start();
        
        return { osc1, osc2, gain };
    }
}

// Global instance
const audioManager = new AudioManager();
