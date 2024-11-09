// Initialize game state
let currentGame = null;
let audioManager = null;
let gameState = {
    currentTheme: null,
    level: 1,
    score: 0,
    unlockedGames: {
        physical: ['hoops'],
        mental: ['colorMatch']
    },
    gameStats: {}
};

// Points needed for each level
const POINTS_PER_LEVEL = 100;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    audioManager = new AudioManager();
    loadSavedState();
    updateStats();
    showWelcome();
    setupEventListeners();
});

// Load saved game state from localStorage
function loadSavedState() {
    try {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            gameState = JSON.parse(savedState);
        }
    } catch (error) {
        console.error('Error loading saved state:', error);
        resetGame();
    }
}

// Save game state to localStorage
function saveGameState() {
    try {
        localStorage.setItem('gameState', JSON.stringify(gameState));
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Update stats display
function updateStats() {
    document.getElementById('player-level').textContent = gameState.level;
    document.getElementById('player-score').textContent = gameState.score;
}

// Show welcome screen
function showWelcome() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
    audioManager.stopBackgroundMusic();
}

// Select game path (Physical or Mental)
function selectPath(path) {
    console.log('Selecting path:', path);
    gameState.currentTheme = path;
    hideAllScreens();
    document.getElementById('game-selection').classList.add('active');
    
    // Start appropriate background music
    audioManager.startBackgroundMusic(path);
    
    loadGames(path);
    audioManager.play('NewLevel');
    saveGameState();
}

// Load games for selected path
function loadGames(path) {
    const games = path === 'physical' ? gameUtils.PHYSICAL_GAMES : gameUtils.MENTAL_GAMES;
    const gamesGrid = document.getElementById('games-grid');
    
    if (!gamesGrid) return;

    gamesGrid.innerHTML = Object.entries(games).map(([id, game]) => `
        <div class="game-card ${gameState.unlockedGames[path].includes(id) ? 'unlocked' : 'locked'}"
             onclick="${gameState.unlockedGames[path].includes(id) ? `startGame('${id}')` : ''}">
            <div class="game-icon">${game.icon}</div>
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            <div class="wellness-tip">💡 ${game.wellnessIdea}</div>
            ${gameState.unlockedGames[path].includes(id) ? 
                `<button class="game-button">Play Now</button>` :
                `<div class="locked-overlay">
                    <i class="fas fa-lock"></i>
                    <span>Unlock at Level ${game.unlockLevel}</span>
                </div>`
            }
        </div>
    `).join('');
}

// Start selected game
function startGame(gameId) {
    if (!isGameUnlocked(gameId)) {
        audioManager.play('Fail');
        showNotification('This game is still locked!');
        return;
    }

    cleanupCurrentGame();
    
    const gameContainer = document.getElementById('active-game-container');
    if (!gameContainer) return;
    
    gameContainer.innerHTML = '';
    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');

    try {
        const GameClass = gameState.currentTheme === 'physical' ? 
            PhysicalGameFactory.createGame(gameId) : 
            MentalGameFactory.createGame(gameId);
            
        currentGame = new GameClass(gameState.level);
        currentGame.initialize();
        
        updateGameStats(gameId, 'timesPlayed');
        saveGameState();
    } catch (error) {
        console.error('Error starting game:', error);
        showNotification('Error starting game. Please try again.');
        returnToSelection();
    }
}

// Check if game is unlocked
function isGameUnlocked(gameId) {
    return gameState.unlockedGames[gameState.currentTheme].includes(gameId);
}

// Return to selection screen
function returnToSelection() {
    cleanupCurrentGame();
    hideAllScreens();
    document.getElementById('game-selection').classList.add('active');
    audioManager.startBackgroundMusic(gameState.currentTheme);
}

// Clean up current game
function cleanupCurrentGame() {
    if (currentGame && typeof currentGame.cleanup === 'function') {
        currentGame.cleanup();
    }
    currentGame = null;
}

// Update score and check for level up
function updateScore(points) {
    gameState.score += points;
    updateStats();
    
    const newLevel = Math.floor(gameState.score / POINTS_PER_LEVEL) + 1;
    if (newLevel > gameState.level) {
        levelUp(newLevel);
    }
    
    saveGameState();
}

// Handle level up
function levelUp(newLevel) {
    const previousLevel = gameState.level;
    gameState.level = newLevel;
    audioManager.play('LevelUp');
    
    const physicalUnlocks = checkUnlocksForCategory('physical');
    const mentalUnlocks = checkUnlocksForCategory('mental');
    const allUnlocks = [...physicalUnlocks, ...mentalUnlocks];
    
    if (allUnlocks.length > 0) {
        showLevelUpModal(allUnlocks);
    }
    
    saveGameState();
    console.log(`Leveled up from ${previousLevel} to ${newLevel}`);
}

// Check for new unlocks in a category
function checkUnlocksForCategory(category) {
    const newUnlocks = [];
    const games = category === 'physical' ? gameUtils.PHYSICAL_GAMES : gameUtils.MENTAL_GAMES;
    
    Object.entries(games).forEach(([id, game]) => {
        if (game.unlockLevel <= gameState.level && 
            !gameState.unlockedGames[category].includes(id)) {
            gameState.unlockedGames[category].push(id);
            newUnlocks.push({
                name: game.name,
                category: category,
                wellnessIdea: game.wellnessIdea
            });
        }
    });
    
    return newUnlocks;
}

// Show level up modal
function showLevelUpModal(newUnlocks) {
    const modal = document.getElementById('level-up-modal');
    const newLevelSpan = document.getElementById('new-level');
    const unlockedContent = document.getElementById('unlocked-content');
    
    newLevelSpan.textContent = gameState.level;
    
    if (newUnlocks.length > 0) {
        const physicalUnlocks = newUnlocks.filter(game => game.category === 'physical');
        const mentalUnlocks = newUnlocks.filter(game => game.category === 'mental');
        
        unlockedContent.innerHTML = `
            <h3>New Games Unlocked! 🎉</h3>
            ${physicalUnlocks.length > 0 ? `
                <h4>Physical Games:</h4>
                <ul>
                    ${physicalUnlocks.map(game => `
                        <li>
                            <strong>${game.name}</strong>
                            <p>Wellness Tip: ${game.wellnessIdea}</p>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
            ${mentalUnlocks.length > 0 ? `
                <h4>Mental Games:</h4>
                <ul>
                    ${mentalUnlocks.map(game => `
                        <li>
                            <strong>${game.name}</strong>
                            <p>Wellness Tip: ${game.wellnessIdea}</p>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
        `;
    } else {
        unlockedContent.innerHTML = `
            <p>Keep playing to unlock more games!</p>
            <p>Points needed for next level: ${((Math.floor(gameState.score / POINTS_PER_LEVEL) + 1) * POINTS_PER_LEVEL) - gameState.score}</p>
        `;
    }
    
    modal.classList.add('active');
}

// Show notification
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Setup event listeners
function setupEventListeners() {
    window.addEventListener('beforeunload', saveGameState);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            returnToSelection();
        }
    });

    // Volume control
    const volumeControl = document.getElementById('volume-control');
    if (volumeControl) {
        volumeControl.addEventListener('input', (e) => {
            audioManager.setBackgroundMusicVolume(e.target.value / 100);
        });
    }

    // Mute toggle
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            const isMuted = audioManager.toggle();
            muteButton.textContent = isMuted ? '🔇' : '🔊';
        });
    }
}

// Hide all screens
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    returnToSelection();
}

// Update game statistics
function updateGameStats(gameId, stat, value) {
    if (!gameState.gameStats[gameId]) {
        gameState.gameStats[gameId] = {
            timesPlayed: 0,
            bestScore: 0
        };
    }

    if (stat === 'timesPlayed') {
        gameState.gameStats[gameId].timesPlayed++;
    } else if (stat === 'bestScore' && value > gameState.gameStats[gameId].bestScore) {
        gameState.gameStats[gameId].bestScore = value;
    }

    saveGameState();
}

// Reset game
function resetGame() {
    gameState = {
        currentTheme: null,
        level: 1,
        score: 0,
        unlockedGames: {
            physical: ['hoops'],
            mental: ['colorMatch']
        },
        gameStats: {}
    };
    saveGameState();
    updateStats();
    showWelcome();
}

// Debug functions
function debugGameState() {
    console.log('Current Game State:', {
        level: gameState.level,
        score: gameState.score,
        unlockedGames: gameState.unlockedGames,
        pointsToNextLevel: POINTS_PER_LEVEL - (gameState.score % POINTS_PER_LEVEL)
    });
}

function addDebugPoints(points) {
    updateScore(points);
    debugGameState();
}

// Export debug interface
window.debugGame = {
    getState: () => gameState,
    reset: resetGame,
    addPoints: addDebugPoints,
    debugState: debugGameState
};

// In browser console:
debugGame.addPoints(50);  // Add points
debugGame.debugState();   // Check state
debugGame.reset();        // Reset game

