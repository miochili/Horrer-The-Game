// Horror-The-Game: Part 1 - Firebase Configuration
// IMPORTANT: Replace these placeholder values with your own Firebase project credentials!

// Step 1: Go to https://console.firebase.google.com/
// Step 2: Create a new project (free)
// Step 3: Enable Authentication > Sign-in method > Google
// Step 4: Enable Firestore Database
// Step 5: Copy your config values below

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
let app, auth, db;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase not configured yet. Game will use local storage only.');
    console.warn('Follow the instructions in js/config.js to set up Firebase.');
}

// Game Configuration
const GAME_CONFIG = {
    // Player settings
    playerSpeed: 5,
    playerSprintMultiplier: 1.8,
    playerStaminaDrain: 25,
    playerStaminaRegen: 10,
    playerMaxHealth: 100,
    
    // Enemy settings
    enemySpeed: 3.5,
    enemyDamage: 25,
    enemyDetectionRange: 15,
    enemyAttackCooldown: 2000,
    
    // Game settings
    checkpointRespawnHealth: 50,
    maxSaveSlots: 3,
    autoSaveInterval: 60000, // 1 minute
    
    // Jump scare settings
    jumpScareMinInterval: 30000, // 30 seconds
    jumpScareMaxInterval: 120000, // 2 minutes
    
    // Audio settings
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    
    // Graphics settings
    graphicsQuality: 'medium',
    shadowEnabled: true,
    fogEnabled: true,
    fogDensity: 0.03,
    fogColor: 0x0a0a0a
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, app, auth, db, GAME_CONFIG };
}
