// Horror-The-Game: Part 1 v2.1 - Enhanced Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

let app, auth, db;
try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
} catch (error) {
    console.warn('Firebase not configured');
}

const GAME_CONFIG = {
    playerSpeed: 6,
    playerSprintMultiplier: 2.0,
    playerStaminaDrain: 30,
    playerStaminaRegen: 15,
    playerMaxHealth: 100,
    playerMaxSanity: 100,
    sanityDrainRate: 2,
    sanityDrainNearEnemy: 8,
    enemySpeed: 4.0,
    enemyDamage: 25,
    enemyDetectionRange: 18,
    enemyAttackCooldown: 1800,
    checkpointRespawnHealth: 50,
    checkpointRespawnSanity: 60,
    maxSaveSlots: 3,
    autoSaveInterval: 45000,
    jumpScareMinInterval: 20000,
    jumpScareMaxInterval: 90000,
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.85,
    graphicsQuality: 'high',
    shadowEnabled: true,
    fogEnabled: true,
    fogDensity: 0.04,
    fogColor: 0x050505,
    mapScale: 2.0,
    numEnemies: 5,
    numPuzzles: 7,
    numCheckpoints: 6
};
