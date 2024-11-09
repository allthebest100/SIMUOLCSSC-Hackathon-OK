// Constants
const CONSTANTS = {
    SCORE_PER_LEVEL: 1000,
    STORAGE_KEY: 'wellnessGameState',
    INITIAL_STATE: {
        currentTheme: null,
        level: 1,
        score: 0,
        unlockedGames: {
            physical: ['hoops'],
            mental: ['colorMatch']
        },
        achievements: [],
        lastPlayed: null,
        soundEnabled: true
    }
};

// Utility Functions
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function showWelcome() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Audio Manager
class AudioManager {
    constructor() {
        this.backgroundMusic = document.getElementById('backgroundMusic');
        this.currentTrack = null;
        this.sounds = {
            LevelUpSound: document.getElementById('LevelUpSound'),
            SuccessSound: document.getElementById('SuccessSound'),
            FailSound: document.getElementById('FailSound'),
            GoodResultSound: document.getElementById('GoodResultSound'),
            NewLevelSound: document.getElementById('NewLevelSound')
        };
    }

    play(soundId) {
        if (!gameManager.state.soundEnabled) return;
        
        const sound = this.sounds[soundId];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => console.error('Error playing sound:', error));
        }
    }

    playBackgroundMusic(theme) {
        if (!gameManager.state.soundEnabled || !this.backgroundMusic) return;

        this.stopBackgroundMusic();

        const sources = this.backgroundMusic.getElementsByTagName('source');
        for (let source of sources) {
            if (source.dataset.track === theme) {
                this.backgroundMusic.src = source.src;
                break;
            }
        }

        this.currentTrack = theme;
        this.backgroundMusic.volume = 0.3;
        this.backgroundMusic.play().catch(error => console.error('Error playing background music:', error));
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.currentTrack = null;
        }
    }

    toggleSound() {
        gameManager.state.soundEnabled = !gameManager.state.soundEnabled;
        
        if (!gameManager.state.soundEnabled) {
            this.stopBackgroundMusic();
        } else if (gameManager.state.currentTheme) {
            this.playBackgroundMusic(gameManager.state.currentTheme);
        }
        
        gameManager.saveState();
    }
}

// Game State Manager
class GameStateManager {
    constructor() {
        this.state = {...CONSTANTS.INITIAL_STATE};
        this.currentGame = null;
        this.audioManager = new AudioManager();
    }

    initialize() {
        this.loadSavedState();
        this.updateStats();
        this.setupEventListeners();
        this.checkDailyRewards();
        showWelcome();
        console.log('Game Manager Initialized');
    }

    loadSavedState() {
        try {
            const savedState = localStorage.getItem(CONSTANTS.STORAGE_KEY);
            if (savedState) {
                this.state = { ...CONSTANTS.INITIAL_STATE, ...JSON.parse(savedState) };
            }
        } catch (error) {
            console.error('Error loading saved state:', error);
            this.state = {...CONSTANTS.INITIAL_STATE};
        }
    }

    saveState() {
        try {
            localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    updateStats() {
        const levelElement = document.getElementById('player-level');
        const scoreElement = document.getElementById('player-score');
        
        if (levelElement && scoreElement) {
            levelElement.textContent = this.state.level;
            scoreElement.textContent = this.state.score.toLocaleString();
        }
    }

    selectPath(path) {
        console.log('Selecting path:', path);
        if (!['physical', 'mental'].includes(path)) {
            console.error('Invalid path selected:', path);
            return;
        }

        this.state.currentTheme = path;
        this.state.lastPlayed = new Date().toISOString();
        this.saveState();
        
        hideAllScreens();
        document.getElementById('game-selection').classList.add('active');
        this.loadGames(path);
        
        this.audioManager.playBackgroundMusic(path);
        this.audioManager.play('NewLevelSound');
    }

    loadGames(path) {
        const games = path === 'physical' ? PHYSICAL_GAMES : MENTAL_GAMES;
        const gamesGrid = document.getElementById('games-grid');
        
        if (!gamesGrid) return;

        gamesGrid.innerHTML = '';
        Object.entries(games).forEach(([id, game]) => {
            const gameCard = this.createGameCard(id, game);
            gamesGrid.insertAdjacentHTML('beforeend', gameCard);
        });
    }

    createGameCard(id, game) {
        const isUnlocked = this.state.unlockedGames[this.state.currentTheme].includes(id);
        const unlockProgress = isUnlocked ? 100 : 
            ((this.state.level / game.unlockLevel) * 100).toFixed(0);

        return `
            <div class="game-card ${isUnlocked ? 'unlocked' : 'locked'}" 
                 data-game-id="${id}">
                <div class="game-icon">${game.icon}</div>
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                ${this.createGameCardContent(id, game, isUnlocked, unlockProgress)}
            </div>
        `;
    }

    createGameCardContent(id, game, isUnlocked, progress) {
        if (isUnlocked) {
            return `
                <button onclick="gameManager.startGame('${id}')" 
                        class="game-button">
                    Play Now
                </button>
                <div class="game-stats">
                    <span>Best Score: ${this.getGameStats(id).bestScore || 0}</span>
                    <span>Times Played: ${this.getGameStats(id).timesPlayed || 0}</span>
                </div>
            `;
        }

        return `
            <div class="locked-overlay">
                <div class="lock-icon">🔒</div>
                <span>Unlock at Level ${game.unlockLevel}</span>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }

    getGameStats(gameId) {
        return {
            bestScore: 0,
            timesPlayed: 0,
            ...(this.state.gameStats?.[gameId] || {})
        };
    }

    startGame(gameId) {
        const isUnlocked = this.state.unlockedGames[this.state.currentTheme].includes(gameId);
        
        if (!isUnlocked) {
            this.audioManager.play('FailSound');
            this.showNotification('This game is still locked!');
            return;
        }

        this.cleanupCurrentGame();
        
        const gameContainer = document.getElementById('active-game-container');
        if (!gameContainer) return;
        
        gameContainer.innerHTML = '';
        hideAllScreens();
        document.getElementById('game-screen').classList.add('active');

        try {
            this.currentGame = this.state.currentTheme === 'physical' ?
                new PhysicalGame(gameId, this) :
                new MentalGame(gameId, this);
                
            this.updateGameStats(gameId, 'timesPlayed');
            this.saveState();
        } catch (error) {
            console.error('Error starting game:', error);
            this.showNotification('Error starting game. Please try again.');
            this.returnToSelection();
        }
    }

    updateGameStats(gameId, stat, value) {
        if (!this.state.gameStats) this.state.gameStats = {};
        if (!this.state.gameStats[gameId]) this.state.gameStats[gameId] = {};
        
        if (stat === 'timesPlayed') {
            this.state.gameStats[gameId].timesPlayed = 
                (this.state.gameStats[gameId].timesPlayed || 0) + 1;
        } else if (stat === 'bestScore' && value > (this.state.gameStats[gameId].bestScore || 0)) {
            this.state.gameStats[gameId].bestScore = value;
        }
    }

    updateScore(points) {
        this.state.score += points;
        this.updateStats();
        
        const newLevel = Math.floor(this.state.score / CONSTANTS.SCORE_PER_LEVEL) + 1;
        if (newLevel > this.state.level) {
            this.levelUp(newLevel);
        }
        
        this.saveState();
    }

    levelUp(newLevel) {
        this.state.level = newLevel;
        this.audioManager.play('LevelUpSound');
        
        const newUnlocks = this.checkUnlocks();
        this.showLevelUpModal(newUnlocks);
        
        this.saveState();
    }

    checkUnlocks() {
        const newUnlocks = [];
        const games = this.state.currentTheme === 'physical' ? PHYSICAL_GAMES : MENTAL_GAMES;

        Object.entries(games).forEach(([id, game]) => {
            if (game.unlockLevel === this.state.level && 
                !this.state.unlockedGames[this.state.currentTheme].includes(id)) {
                this.state.unlockedGames[this.state.currentTheme].push(id);
                newUnlocks.push(game.name);
            }
        });

        return newUnlocks;
    }

    showLevelUpModal(newUnlocks) {
        const modal = document.getElementById('level-up-modal');
        const newLevelSpan = document.getElementById('new-level');
        const unlockedContent = document.getElementById('unlocked-content');

        if (modal && newLevelSpan && unlockedContent) {
            newLevelSpan.textContent = this.state.level;
            
            if (newUnlocks.length > 0) {
                unlockedContent.innerHTML = `
                    <p>New games unlocked:</p>
                    <ul>
                        ${newUnlocks.map(game => `<li>${game}</li>`).join('')}
                    </ul>
                `;
            } else {
                unlockedContent.innerHTML = '';
            }

            modal.classList.add('active');
        }
    }

    checkDailyRewards() {
        const lastPlayed = new Date(this.state.lastPlayed);
        const now = new Date();
        
        if (!this.state.lastPlayed || 
            lastPlayed.getDate() !== now.getDate() || 
            lastPlayed.getMonth() !== now.getMonth()) {
            this.showDailyReward();
        }
    }

    showDailyReward() {
        const reward = {
            score: 100,
            message: "Welcome back! Here's your daily reward!"
        };

        this.updateScore(reward.score);
        this.showNotification(reward.message);
    }

    showNotification(message, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), duration);
    }

    setupEventListeners() {
        window.addEventListener('beforeunload', () => this.saveState());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.returnToSelection();
            }
        });
    }

    returnToSelection() {
        this.cleanupCurrentGame();
        hideAllScreens();
        document.getElementById('game-selection').classList.add('active');
        
        if (this.state.currentTheme) {
            this.audioManager.playBackgroundMusic(this.state.currentTheme);
        }
    }

    cleanupCurrentGame() {
        if (this.currentGame?.cleanup) {
            this.currentGame.cleanup();
        }
        this.currentGame = null;
    }
}

// Global functions for HTML onclick events
function selectPath(path) {
    console.log('selectPath called with:', path);
    if (gameManager) {
        gameManager.selectPath(path);
    } else {
        console.error('Game manager not initialized');
    }
}

function returnToSelection() {
    if (gameManager) {
        gameManager.returnToSelection();
    }
}

// Initialize game manager
let gameManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game manager');
    gameManager = new GameStateManager();
    gameManager.initialize();
});

// Export for debugging
window.gameManager = gameManager;

