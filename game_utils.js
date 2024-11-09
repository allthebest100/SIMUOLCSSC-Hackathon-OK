// Game Configurations
const physicalGames = {
    hoops: {
        name: "Hoops Hero",
        icon: "🏀",
        description: "Test your aim and timing skills",
        unlockLevel: 1,
        wellnessTip: "Aim Steady"
    },
    runner: {
        name: "Runner's Challenge",
        icon: "🏃‍♂️",
        description: "Keep your pace and dodge obstacles",
        unlockLevel: 2,
        wellnessTip: "Pace Yourself"
    },
    squat: {
        name: "Squat Jumper",
        icon: "🦿",
        description: "Perfect your form and timing",
        unlockLevel: 3,
        wellnessTip: "Form First"
    },
    swim: {
        name: "Lane Swimmer",
        icon: "🏊‍♂️",
        description: "Find your rhythm in the water",
        unlockLevel: 4,
        wellnessTip: "Find Rhythm"
    },
    cycle: {
        name: "Cycling Challenge",
        icon: "🚲",
        description: "Maintain speed and balance",
        unlockLevel: 5,
        wellnessTip: "Stay Hydrated"
    }
};

const mentalGames = {
    colorMatch: {
        name: "Colour Match",
        icon: "🎨",
        description: "Match colors with focused precision",
        unlockLevel: 1,
        wellnessTip: "Calm Focus"
    },
    memoryTiles: {
        name: "Memory Tiles",
        icon: "🧩",
        description: "Test and improve your memory",
        unlockLevel: 2,
        wellnessTip: "Sharpen Memory"
    },
    puzzle2048: {
        name: "2048",
        icon: "🔢",
        description: "Combine numbers strategically",
        unlockLevel: 3,
        wellnessTip: "Patience Wins"
    },
    snake: {
        name: "Snake",
        icon: "🐍",
        description: "Guide the snake with mindfulness",
        unlockLevel: 4,
        wellnessTip: "Mindful Moves"
    },
    whackaMole: {
        name: "Whack-a-Mole",
        icon: "🔨",
        description: "Release stress with quick reactions",
        unlockLevel: 5,
        wellnessTip: "Stress Release"
    }
};

// Audio Management
class AudioManager {
    constructor() {
        this.sounds = {
            LevelUp: document.getElementById('LevelUpSound'),
            Success: document.getElementById('SuccessSound'),
            Fail: document.getElementById('FailSound'),
            GoodResult: document.getElementById('GoodResultSound'),
            NewLevel: document.getElementById('NewLevelSound')
        };
        this.enabled = true;
    }

    play(soundName) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(err => console.log('Audio play failed:', err));
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Timer Management
class GameTimer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.timerId = null;
        this.isPaused = false;
    }

    start() {
        if (this.timerId) return;
        
        this.timerId = setInterval(() => {
            if (!this.isPaused) {
                this.remaining--;
                if (this.onTick) this.onTick(this.remaining);
                
                if (this.remaining <= 0) {
                    this.stop();
                    if (this.onComplete) this.onComplete();
                }
            }
        }, 1000);
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    reset() {
        this.stop();
        this.remaining = this.duration;
        this.isPaused = false;
    }

    getTimeLeft() {
        return this.remaining;
    }
}

// Animation Utilities
const AnimationUtils = {
    animateNumber(element, start, end, duration = 1000) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const animate = () => {
            current += increment;
            element.textContent = Math.round(current);
            
            if ((increment > 0 && current < end) || 
                (increment < 0 && current > end)) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
            }
        };
        
        requestAnimationFrame(animate);
    },

    shakeElement(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    },

    addTemporaryClass(element, className, duration) {
        element.classList.add(className);
        setTimeout(() => element.classList.remove(className), duration);
    }
};

// UI Utilities
const UIUtils = {
    createProgressBar(containerId, progress) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
        `;
    },

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `game-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};

// Math Utilities
const MathUtils = {
    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },

    calculateScore(basePoints, multiplier = 1, bonus = 0) {
        return Math.floor((basePoints * multiplier) + bonus);
    }
};

// Export all utilities and configurations
window.gameUtils = {
    physicalGames,
    mentalGames,
    AudioManager,
    GameTimer,
    AnimationUtils,
    UIUtils,
    MathUtils
};

// Squat Jumper Game
class SquatGame extends PhysicalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = PHYSICAL_GAMES.squat.levels[level - 1];
        this.currentSet = 1;
        this.reps = 0;
        this.isSquatting = false;
        this.squatDepth = 0;
        this.perfectSquats = 0;
        this.startTime = null;
        this.squatStartTime = null;
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="squat-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <span>Set: <span id="current-set">${this.currentSet}</span>/${this.levelData.sets}</span>
                        <span>Reps: <span id="current-reps">${this.reps}</span>/${this.levelData.reps}</span>
                        <span>Perfect: <span id="perfect-squats">${this.perfectSquats}</span></span>
                    </div>
                </div>

                <div class="exercise-area">
                    <div class="character-container">
                        <div id="character" class="character">🧍</div>
                        <div class="form-indicator">
                            <div class="depth-marker perfect-zone"></div>
                            <div id="current-depth" class="depth-marker current"></div>
                        </div>
                    </div>

                    <div class="form-guide">
                        <div class="guide-line">Perfect Form</div>
                        <div class="guide-zones">
                            <span>Too High</span>
                            <span>Perfect Zone</span>
                            <span>Too Low</span>
                        </div>
                    </div>

                    <div class="timer-container">
                        <div class="squat-timer" id="squat-timer">0.0s</div>
                        <div class="timer-label">Hold Time</div>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Set ${this.currentSet}</button>
                    <div class="instructions">
                        <p>Hold SPACE to squat down</p>
                        <p>Hold in perfect zone for bonus points</p>
                        <p>Release to stand up</p>
                    </div>
                </div>

                <div class="feedback-container" id="feedback">
                    <div class="feedback-text"></div>
                </div>
            </div>
        `;

        this.setupGame();
    }

    setupGame() {
        this.character = document.getElementById('character');
        this.depthMarker = document.getElementById('current-depth');
        this.startButton = document.getElementById('start-btn');
        this.feedbackContainer = document.getElementById('feedback');
        this.squatTimer = document.getElementById('squat-timer');

        this.startButton.addEventListener('click', () => this.startSet());
    }

    bindEvents() {
        this.handleKeyDown = (e) => {
            if (e.code === 'Space' && this.isActive && !this.isSquatting) {
                e.preventDefault();
                this.startSquat();
            }
        };

        this.handleKeyUp = (e) => {
            if (e.code === 'Space' && this.isSquatting) {
                e.preventDefault();
                this.endSquat();
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    startSet() {
        this.isActive = true;
        this.startButton.style.display = 'none';
        this.audioManager.play('NewLevel');
        this.showFeedback('Get ready...', 'info');
    }

    startSquat() {
        this.isSquatting = true;
        this.squatStartTime = Date.now();
        this.startSquatAnimation();
    }

    startSquatAnimation() {
        let startTime = Date.now();
        
        const animate = () => {
            if (!this.isSquatting) return;

            const currentTime = Date.now();
            const elapsed = (currentTime - startTime) / 1000;
            this.squatDepth = Math.min(100, elapsed * 100); // 1 second to reach full depth

            this.updateSquatVisuals();
            this.updateSquatTimer();

            if (this.squatDepth < 100) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateSquatVisuals() {
        // Update character appearance
        this.character.style.transform = `scaleY(${1 - (this.squatDepth / 200)})`;
        this.depthMarker.style.top = `${this.squatDepth}%`;

        // Change character emoji based on depth
        if (this.squatDepth < 30) {
            this.character.textContent = '🧍';
        } else if (this.squatDepth < 70) {
            this.character.textContent = '🏃';
        } else {
            this.character.textContent = '🦿';
        }

        // Update form feedback
        this.updateFormFeedback();
    }

    updateFormFeedback() {
        if (this.squatDepth >= 40 && this.squatDepth <= 60) {
            this.showFeedback('Perfect form! 👍', 'success');
            this.depthMarker.classList.add('perfect');
        } else {
            this.depthMarker.classList.remove('perfect');
            if (this.squatDepth < 40) {
                this.showFeedback('Go lower! 🔽', 'warning');
            } else if (this.squatDepth > 60) {
                this.showFeedback('Too low! 🔼', 'warning');
            }
        }
    }

    updateSquatTimer() {
        const holdTime = (Date.now() - this.squatStartTime) / 1000;
        this.squatTimer.textContent = `${holdTime.toFixed(1)}s`;
    }

    endSquat() {
        if (!this.isSquatting) return;

        this.isSquatting = false;
        const holdTime = (Date.now() - this.squatStartTime) / 1000;
        
        // Check if squat was good
        if (this.squatDepth >= 40 && this.squatDepth <= 60 && holdTime >= 1) {
            this.countSuccessfulRep(holdTime);
        } else {
            this.showFeedback('Invalid squat! Try again', 'error');
            this.audioManager.play('Fail');
        }

        // Reset visuals
        this.squatDepth = 0;
        this.updateSquatVisuals();
        this.squatTimer.textContent = '0.0s';
        this.depthMarker.classList.remove('perfect');
    }

    countSuccessfulRep(holdTime) {
        this.reps++;
        
        // Perfect squat criteria
        if (this.squatDepth >= 45 && this.squatDepth <= 55 && holdTime >= 2) {
            this.perfectSquats++;
            this.audioManager.play('GoodResult');
            this.showFeedback('Perfect squat! +2 seconds hold! 💪', 'success');
        } else {
            this.audioManager.play('Success');
            this.showFeedback('Good squat! 👍', 'success');
        }

        this.updateStats();
        
        if (this.reps >= this.levelData.reps) {
            this.completeSet();
        }
    }

    updateStats() {
        document.getElementById('current-reps').textContent = this.reps;
        document.getElementById('perfect-squats').textContent = this.perfectSquats;
    }

    completeSet() {
        if (this.currentSet >= this.levelData.sets) {
            this.completeGame();
        } else {
            this.currentSet++;
            this.reps = 0;
            this.updateStats();
            document.getElementById('current-set').textContent = this.currentSet;
            
            this.startButton.textContent = `Start Set ${this.currentSet}`;
            this.startButton.style.display = 'block';
            this.showFeedback('Set complete! Take a short rest', 'success');
        }
    }

    completeGame() {
        const perfectionBonus = this.perfectSquats * 20;
        const totalPoints = this.levelData.points + perfectionBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Workout Complete! 🎉",
            {
                "Sets Completed": this.levelData.sets,
                "Total Reps": this.levelData.sets * this.levelData.reps,
                "Perfect Squats": this.perfectSquats
            },
            {
                "Base Points": this.levelData.points,
                "Perfect Form Bonus": perfectionBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    showFeedback(message, type) {
        this.feedbackContainer.innerHTML = `<div class="feedback-text ${type}">${message}</div>`;
    }

    cleanup() {
        super.cleanup();
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Update the PhysicalGameFactory
class PhysicalGameFactory {
    static createGame(gameId, level, gameManager) {
        switch(gameId) {
            case 'hoops':
                return new HoopsGame(level, gameManager);
            case 'runner':
                return new RunnerGame(level, gameManager);
            case 'squat':
                return new SquatGame(level, gameManager);
            // Add other games here
            default:
                throw new Error(`Unknown game: ${gameId}`);
        }
    }
}

