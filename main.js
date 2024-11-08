// Game state
let currentGame = null;
let gameState = {
    currentTheme: null,
    level: 1,
    score: 0,
    unlockedGames: {
        physical: ['run'],
        mental: ['puzzle2048']
    }
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSavedState();
    updateStats();
    showWelcome();
});

// Load saved game state from localStorage
function loadSavedState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
    }
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
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
}

// Select path (Physical or Mental)
function selectPath(path) {
    gameState.currentTheme = path;
    hideAllScreens();
    document.getElementById('game-selection').classList.add('active');
    loadGames(path);
    playSound('NewLevelSound');
}

// Load games for selected path
function loadGames(path) {
    const games = path === 'physical' ? physicalGames : mentalGames;
    const gamesGrid = document.getElementById('games-grid');

    gamesGrid.innerHTML = Object.entries(games).map(([id, game]) => `
        <div class="game-card ${gameState.unlockedGames[path].includes(id) ? '' : 'locked'}">
            <div class="game-icon">${game.icon}</div>
            <h3>${game.name}</h3>
            <p>${game.description}</p>
            ${gameState.unlockedGames[path].includes(id) ? 
                `<button onclick="startGame('${id}')" class="game-button">Play Now</button>` :
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
        playSound('FailSound');
        return;
    }

    // Clean up previous game if exists
    if (currentGame && typeof currentGame.cleanup === 'function') {
        currentGame.cleanup();
    }

    // Clear game container
    const gameContainer = document.getElementById('active-game-container');
    gameContainer.innerHTML = '';

    hideAllScreens();
    document.getElementById('game-screen').classList.add('active');

    if (gameState.currentTheme === 'physical') {
        startPhysicalGame(gameId);
    } else {
        startMentalGame(gameId);
    }
}

// Check if game is unlocked
function isGameUnlocked(gameId) {
    return gameState.unlockedGames[gameState.currentTheme].includes(gameId);
}

// Return to selection screen
function returnToSelection() {
    if (currentGame && typeof currentGame.cleanup === 'function') {
        currentGame.cleanup();
        currentGame = null;
    }
    hideAllScreens();
    document.getElementById('game-selection').classList.add('active');
}

// Retry current game
function retryGame() {
    if (currentGame && typeof currentGame.cleanup === 'function') {
        currentGame.cleanup();
    }
    startGame(currentGame.constructor.name.toLowerCase());
}

// Update score and check for level up
function updateScore(points) {
    gameState.score += points;
    updateStats();
    saveGameState();
    
    // Check for level up
    const newLevel = Math.floor(gameState.score / 1000) + 1;
    if (newLevel > gameState.level) {
        levelUp(newLevel);
    } else {
        returnToSelection();
    }
}

// Handle level up
function levelUp(newLevel) {
    gameState.level = newLevel;
    playSound('LevelUpSound');
    
    // Check for new unlocks
    const newUnlocks = checkUnlocks();
    showLevelUpModal(newUnlocks);
    saveGameState();
}

// Check for new game unlocks
function checkUnlocks() {
    const newUnlocks = [];
    const games = gameState.currentTheme === 'physical' ? physicalGames : mentalGames;
    
    Object.entries(games).forEach(([id, game]) => {
        if (game.unlockLevel === gameState.level && 
            !gameState.unlockedGames[gameState.currentTheme].includes(id)) {
            gameState.unlockedGames[gameState.currentTheme].push(id);
            newUnlocks.push(game.name);
        }
    });
    
    return newUnlocks;
}

// Show level up modal
function showLevelUpModal(unlockedGames) {
    const modal = document.getElementById('level-up-modal');
    const newLevelSpan = document.getElementById('new-level');
    const unlockedContent = document.getElementById('unlocked-content');
    
    newLevelSpan.textContent = gameState.level;
    unlockedContent.innerHTML = unlockedGames.length ? `
        <h3>New Games Unlocked!</h3>
        <ul>
            ${unlockedGames.map(game => `<li>${game}</li>`).join('')}
        </ul>
    ` : '';
    
    modal.classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    returnToSelection();
}

// Hide all screens
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Play sound function
function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.play();
    }
}

// Debug function
function debugGameState() {
    console.log('Current Game State:', {
        theme: gameState.currentTheme,
        level: gameState.level,
        score: gameState.score,
        unlockedGames: gameState.unlockedGames
    });
}

// Reset game state (for testing)
function resetGame() {
    gameState = {
        currentTheme: null,
        level: 1,
        score: 0,
        unlockedGames: {
            physical: ['run'],
            mental: ['puzzle2048']
        }
    };
    saveGameState();
    updateStats();
    showWelcome();
}

// Add this to handle browser refresh/close
window.addEventListener('beforeunload', () => {
    saveGameState();
});
