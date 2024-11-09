// Game Configurations
const PHYSICAL_GAMES = {
    hoops: {
        name: "Hoops Hero",
        icon: "🏀",
        description: "Test your aim and timing",
        unlockLevel: 1,
        wellnessIdea: "Aim Steady"
    },
    running: {
        name: "Runner's Challenge",
        icon: "🏃",
        description: "Test your endurance",
        unlockLevel: 2,
        wellnessIdea: "Pace Yourself"
    },
    squats: {
        name: "Squat Jumper",
        icon: "💪",
        description: "Perfect your form",
        unlockLevel: 3,
        wellnessIdea: "Form First"
    },
    swimming: {
        name: "Lane Swimmer",
        icon: "🏊",
        description: "Find your rhythm",
        unlockLevel: 4,
        wellnessIdea: "Find Rhythm"
    },
    cycling: {
        name: "Cycling Challenge",
        icon: "🚲",
        description: "Stay hydrated",
        unlockLevel: 5,
        wellnessIdea: "Stay Hydrated"
    }
};

const MENTAL_GAMES = {
    colorMatch: {
        name: "Colour Match",
        icon: "🎨",
        description: "Train your focus",
        unlockLevel: 1,
        wellnessIdea: "Calm Focus"
    },
    memoryTiles: {
        name: "Memory Tiles",
        icon: "🧩",
        description: "Test your memory",
        unlockLevel: 2,
        wellnessIdea: "Sharpen Memory"
    },
    puzzle2048: {
        name: "2048",
        icon: "🔢",
        description: "Strategic thinking",
        unlockLevel: 3,
        wellnessIdea: "Patience Wins"
    },
    snake: {
        name: "Snake",
        icon: "🐍",
        description: "Guide the snake",
        unlockLevel: 4,
        wellnessIdea: "Mindful Moves"
    },
    whackaMole: {
        name: "Whack-a-Mole",
        icon: "🔨",
        description: "Quick reactions",
        unlockLevel: 5,
        wellnessIdea: "Stress Release"
    }
};

// Audio Management
class AudioManager {
    constructor() {
        // Effect sounds
        this.sounds = {
            LevelUp: document.getElementById('LevelUpSound'),
            Success: document.getElementById('SuccessSound'),
            Fail: document.getElementById('FailSound'),
            GoodResult: document.getElementById('GoodResultSound'),
            NewLevel: document.getElementById('NewLevelSound')
        };

        // Background music
        this.backgroundMusic = {
            physical: document.getElementById('physical_fitness'),
            mental: document.getElementById('mental_health')
        };

        this.currentBgMusic = null;
        this.enabled = true;
        this.bgMusicVolume = 0.3; // Default background music volume
    }

    // Play sound effects
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        sound.currentTime = 0;
        sound.play().catch(err => console.log('Audio play failed:', err));
    }

    // Start background music for selected game type
    startBackgroundMusic(gameType) {
        // Stop current background music if playing
        this.stopBackgroundMusic();

        // Select the appropriate background music
        const music = gameType === 'physical' ? 
            this.backgroundMusic.physical : 
            this.backgroundMusic.mental;

        if (music && this.enabled) {
            music.volume = this.bgMusicVolume;
            music.loop = true;
            this.currentBgMusic = music;
            music.play().catch(err => console.log('Background music failed:', err));
        }
    }

    // Stop background music
    stopBackgroundMusic() {
        if (this.currentBgMusic) {
            this.currentBgMusic.pause();
            this.currentBgMusic.currentTime = 0;
            this.currentBgMusic = null;
        }
    }

    // Pause background music (without resetting)
    pauseBackgroundMusic() {
        if (this.currentBgMusic) {
            this.currentBgMusic.pause();
        }
    }

    // Resume background music
    resumeBackgroundMusic() {
        if (this.currentBgMusic && this.enabled) {
            this.currentBgMusic.play().catch(err => console.log('Resume music failed:', err));
        }
    }

    // Set background music volume
    setBackgroundMusicVolume(volume) {
        this.bgMusicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentBgMusic) {
            this.currentBgMusic.volume = this.bgMusicVolume;
        }
    }

    // Toggle all audio
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBackgroundMusic();
        } else if (this.currentBgMusic) {
            this.resumeBackgroundMusic();
        }
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

// Utility Functions
const GameUtils = {
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

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

    createProgressBar(containerId, progress) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
        `;
    },

    addTemporaryClass(element, className, duration) {
        element.classList.add(className);
        setTimeout(() => element.classList.remove(className), duration);
    },

    shakeElement(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    },

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
    }
};

// Export all utilities and configurations
window.gameUtils = {
    PHYSICAL_GAMES,
    MENTAL_GAMES,
    AudioManager,
    GameTimer,
    GameUtils
};

