// Audio Management
const audioElements = {
    LevelUp: document.getElementById('LevelUpSound'),
    Success: document.getElementById('SuccessSound'),
    Fail: document.getElementById('FailSound'),
    GoodResult: document.getElementById('GoodResultSound'),
    NewLevel: document.getElementById('NewLevelSound')
};

function playSound(soundName) {
    const sound = audioElements[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log('Audio play failed:', err));
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
    }

    start() {
        this.timerId = setInterval(() => {
            this.remaining--;
            if (this.onTick) this.onTick(this.remaining);
            
            if (this.remaining <= 0) {
                this.stop();
                if (this.onComplete) this.onComplete();
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

// Format time for display
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Create animated number
function animateNumber(element, start, end, duration = 1000) {
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
}

// Create progress bar
function createProgressBar(containerId, progress) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
        </div>
    `;
}

// Add temporary class
function addTemporaryClass(element, className, duration) {
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), duration);
}

// Shake animation
function shakeElement(element) {
    element.classList.add('shake');
    element.addEventListener('animationend', () => {
        element.classList.remove('shake');
    });
}

// Random number between min and max
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}