// Audio Management
const gameAudio = {
    levelUp: document.getElementById('levelUpSound'),
    success: document.getElementById('successSound'),
    fail: document.getElementById('failSound'),
    goodResult: document.getElementById('goodResultSound'),
    newLevel: document.getElementById('newLevelSound')
};

function playSound(soundName) {
    const sound = gameAudio[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log('Audio playback failed:', err));
    }
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Modal Management
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Timer Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

class GameTimer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.timerId = null;
    }

    start() {
        this.timerId = setInterval(() => {
            this.remaining--;
            this.onTick(this.remaining);
            
            if (this.remaining <= 0) {
                this.stop();
                this.onComplete();
            }
        }, 1000);
    }

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    reset() {
        this.stop();
        this.remaining = this.duration;
    }
}

// Progress Bar
class ProgressBar {
    constructor(elementId, maxValue) {
        this.element = document.getElementById(elementId);
        this.maxValue = maxValue;
    }

    update(currentValue) {
        const percentage = (currentValue / this.maxValue) * 100;
        this.element.style.width = `${percentage}%`;
    }
}

// Score Management
function formatScore(score) {
    return score.toString().padStart(5, '0');
}

// Animation Helper
function addTemporaryClass(element, className, duration) {
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), duration);
}