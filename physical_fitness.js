// Physical Games Configuration
const physicalGames = {
    run: {
        id: 'run',
        name: "Runner's Challenge",
        icon: '🏃',
        description: "Complete running exercises with proper form",
        unlockLevel: 1,
        levels: [
            { distance: 500, time: 180, points: 100, name: "Beginner Sprint" },
            { distance: 1000, time: 360, points: 200, name: "Intermediate Run" },
            { distance: 2000, time: 720, points: 300, name: "Advanced Marathon" }
        ]
    },
    squat: {
        id: 'squat',
        name: "Squat Jumper",
        icon: '💪',
        description: "Perfect your squat jumps",
        unlockLevel: 2,
        levels: [
            { reps: 10, sets: 2, points: 150, name: "Basic Squats" },
            { reps: 15, sets: 3, points: 250, name: "Power Squats" },
            { reps: 20, sets: 3, points: 350, name: "Expert Squats" }
        ]
    },
    swim: {
        id: 'swim',
        name: "Lane Swimmer",
        icon: '🏊',
        description: "Swimming exercises for full body workout", 
        unlockLevel: 3,
        levels: [
            { laps: 4, style: 'freestyle', points: 200, name: "Basic Swim" },
            { laps: 6, style: 'mixed', points: 300, name: "Advanced Swim" },
            { laps: 8, style: 'advanced', points: 400, name: "Pro Swimmer" }
        ]
    }
};

// Start Physical Game
function startPhysicalGame(gameId) {
    const game = physicalGames[gameId];
    
    switch(gameId) {
        case 'run':
            currentGame = new RunningGame(1);
            break;
        case 'squat':
            currentGame = new SquatGame(1);  
            break;
        case 'swim':
            currentGame = new SwimmingGame(1);
            break;
    }
    
    if (currentGame) {
        currentGame.initialize();
    }
}

// Running Game
class RunningGame {
    constructor(level) {
        this.level = level;
        this.levelData = physicalGames.run.levels[level - 1];
        this.distance = 0;
        this.timeLeft = this.levelData.time;
        this.isActive = false;
        this.timer = null;
        this.stepCount = 0;
        this.lastStepTime = 0;
        this.perfectSteps = 0;
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="running-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="level-info">Level ${this.level}</div>
                </div>
                
                <div class="game-stats">
                    <div class="stat">
                        <i class="fas fa-route"></i>
                        <span id="distance">0</span>/${this.levelData.distance}m
                    </div>
                    <div class="stat">
                        <i class="fas fa-clock"></i>
                        <span id="timer">${formatTime(this.timeLeft)}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-shoe-prints"></i>
                        <span id="perfect-steps">0</span> perfect steps
                    </div>
                </div>

                <div class="track-container">
                    <div class="running-track">
                        <div id="runner" class="runner">🏃</div>
                        <div class="track-marks"></div>
                    </div>
                    <div id="progress-bar" class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                </div>

                <div class="rhythm-meter">
                    <div class="rhythm-bar">
                        <div id="rhythm-indicator" class="rhythm-indicator"></div>
                    </div>
                    <div class="rhythm-marks">
                        <span>Too Slow</span>
                        <span>Perfect</span>
                        <span>Too Fast</span>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Running!</button>
                    <button id="pause-btn" class="game-button hidden">Pause</button>
                    <div class="instructions">
                        <p>Press SPACE repeatedly to run!</p>
                        <p>Keep a steady rhythm for bonus points</p>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startRunning());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseRunning());
    }

    bindEvents() {
        this.handleKeyPress = (e) => {
            if (e.code === 'Space' && this.isActive) {
                e.preventDefault();
                this.handleStep();
            }
        };
        document.addEventListener('keydown', this.handleKeyPress);
    }

    startRunning() {
        this.isActive = true;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('pause-btn').classList.remove('hidden');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        playSound('newLevel');
    }

    pauseRunning() {
        this.isActive = false;
        clearInterval(this.timer);
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('start-btn').textContent = 'Resume';
    }

    handleStep() {
        if (!this.isActive) return;

        const now = Date.now();
        const stepInterval = now - this.lastStepTime;
        
        // Check rhythm (ideal step interval is 500ms)
        if (stepInterval > 200) { // Prevent too rapid steps
            this.incrementDistance(this.getRhythmQuality(stepInterval));
            this.lastStepTime = now;
            this.stepCount++;
            this.animateStep();
        }
    }

    getRhythmQuality(interval) {
        const idealInterval = 500;
        const difference = Math.abs(interval - idealInterval);
        
        if (difference < 50) {
            this.perfectSteps++;
            document.getElementById('perfect-steps').textContent = this.perfectSteps;
            return 1.5; // Perfect rhythm bonus
        } else if (difference < 100) {
            return 1.2; // Good rhythm bonus
        }
        return 1; // Normal step
    }

    incrementDistance(multiplier = 1) {
        const baseIncrement = 10;
        const increment = baseIncrement * multiplier;
        
        this.distance += increment;
        this.updateDistance();
        
        if (this.distance >= this.levelData.distance) {
            this.completeGame();
        }
    }

    updateDistance() {
        const distanceDisplay = document.getElementById('distance');
        const runner = document.getElementById('runner');
        const progressFill = document.querySelector('.progress-fill');
        
        distanceDisplay.textContent = Math.floor(this.distance);
        
        const progress = (this.distance / this.levelData.distance) * 100;
        runner.style.left = `${Math.min(progress, 100)}%`;
        progressFill.style.width = `${Math.min(progress, 100)}%`;
    }

    updateTimer() {
        document.getElementById('timer').textContent = formatTime(this.timeLeft);
    }

    animateStep() {
        const runner = document.getElementById('runner');
        runner.classList.add('step-animation');
        setTimeout(() => runner.classList.remove('step-animation'), 150);
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        const timeBonus = Math.floor(this.timeLeft / 2);
        const rhythmBonus = Math.floor(this.perfectSteps * 5);
        const totalPoints = this.levelData.points + timeBonus + rhythmBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, timeBonus, rhythmBonus);
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        if (this.distance >= this.levelData.distance) {
            this.completeGame();
        } else {
            playSound('fail');
            this.showFailDialog();
        }
    }

    showCompletionDialog(totalPoints, timeBonus, rhythmBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Amazing Run! 🎉</h2>
                <div class="stats-summary">
                    <p>Distance Covered: ${Math.floor(this.distance)}m</p>
                    <p>Perfect Steps: ${this.perfectSteps}</p>
                    <p>Time Remaining: ${this.timeLeft}s</p>
                </div>
                <div class="points-breakdown">
                    <p>Base Points: ${this.levelData.points}</p>
                    <p>Time Bonus: +${timeBonus}</p>
                    <p>Rhythm Bonus: +${rhythmBonus}</p>
                    <p class="total-points">Total Points: ${totalPoints}</p>
                </div>
                <button onclick="updateScore(${totalPoints})" class="game-button">Continue</button>
            </div>
        `;
        document.getElementById('active-game-container').appendChild(dialog);
    }

    showFailDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog failure';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Time's Up! ⏰</h2>
                <div class="stats-summary">
                    <p>Distance Covered: ${Math.floor(this.distance)}m</p>
                    <p>Target Distance: ${this.levelData.distance}m</p>
                    <p>Completion: ${Math.floor((this.distance / this.levelData.distance) * 100)}%</p>
                </div>
                <div class="action-buttons">
                    <button onclick="retryGame()" class="game-button">Try Again</button>
                    <button onclick="returnToSelection()" class="game-button secondary">Exit</button>
                </div>
            </div>
        `;
        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        clearInterval(this.timer);
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Squat Game
class SquatGame {
    constructor(level) {
        this.level = level;
        this.levelData = physicalGames.squat.levels[level - 1];
        this.currentSet = 1;
        this.reps = 0;
        this.isActive = false;
        this.inSquat = false;
        this.squatStartTime = 0;
        this.perfectSquats = 0;
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="squat-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="level-info">Level ${this.level}</div>
                </div>

                <div class="game-stats">
                    <div class="stat">
                        <i class="fas fa-layer-group"></i>
                        Set <span id="current-set">${this.currentSet}</span>/${this.levelData.sets}
                    </div>
                    <div class="stat">
                        <i class="fas fa-redo"></i>
                        Rep <span id="current-reps">${this.reps}</span>/${this.levelData.reps}
                    </div>
                    <div class="stat">
                        <i class="fas fa-star"></i>
                        Perfect: <span id="perfect-squats">${this.perfectSquats}</span>
                    </div>
                </div>

                <div class="exercise-area">
                    <div id="character" class="character">🧍‍♂️</div>
                    <div class="form-meter">
                        <div id="form-indicator" class="form-indicator"></div>
                        <div class="form-marks">
                            <span>Start</span>
                            <span>Perfect Form</span>
                            <span>Too Low</span>
                        </div>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Set</button>
                    <div class="instructions">
                        <p>Hold SPACE to squat down</p>
                        <p>Release to stand up</p>
                        <p>Keep proper form for bonus points</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('start-btn').addEventListener('click', () => this.startSet());
    }

    bindEvents() {
        this.handleKeyDown = (e) => {
            if (e.code === 'Space' && this.isActive && !this.inSquat) {
                e.preventDefault();
                this.startSquat();
            }
        };

        this.handleKeyUp = (e) => {
            if (e.code === 'Space' && this.inSquat) {
                e.preventDefault();
                this.endSquat();
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    startSet() {
        this.isActive = true;
        document.getElementById('start-btn').classList.add('hidden');
        playSound('newLevel');
    }

    startSquat() {
        this.inSquat = true;
        this.squatStartTime = Date.now();
        this.updateCharacter('squatting');
        this.startFormTracking();
    }

    endSquat() {
        if (!this.inSquat) return;

        const squatDuration = Date.now() - this.squatStartTime;
        const formScore = this.calculateFormScore(squatDuration);
        
        this.inSquat = false;
        this.updateCharacter('standing');
        
        if (formScore >= 70) {
            this.countRep(formScore);
        } else {
            this.showFormWarning();
        }
    }

    updateCharacter(state) {
        const character = document.getElementById('character');
        character.textContent = state === 'squatting' ? '🏃' : '🧍‍♂️';
        character.className = `character ${state}`;
    }

    startFormTracking() {
        const formIndicator = document.getElementById('form-indicator');
        let trackingInterval = setInterval(() => {
            if (!this.inSquat) {
                clearInterval(trackingInterval);
                formIndicator.style.height = '0%';
                return;
            }

            const duration = Date.now() - this.squatStartTime;
            const form = this.calculateFormScore(duration);
            formIndicator.style.height = `${form}%`;
            formIndicator.style.backgroundColor = form >= 70 ? '#4CAF50' : '#FF5252';
        }, 50);
    }

    calculateFormScore(duration) {
        // Ideal squat duration: 2-3 seconds
        const idealDuration = 2500;
        const variance = Math.abs(duration - idealDuration);
        return Math.max(0, 100 - (variance / 50));
    }

    countRep(formScore) {
        this.reps++;
        if (formScore >= 90) {
            this.perfectSquats++;
            playSound('goodResult');
        } else {
            playSound('success');
        }

        this.updateUI();

        if (this.reps >= this.levelData.reps) {
            this.completeSet();
        }
    }

    updateUI() {
        document.getElementById('current-reps').textContent = this.reps;
        document.getElementById('perfect-squats').textContent = this.perfectSquats;
    }

    completeSet() {
        this.isActive = false;
        
        if (this.currentSet >= this.levelData.sets) {
            this.completeGame();
        } else {
            this.currentSet++;
            this.reps = 0;
            document.getElementById('current-set').textContent = this.currentSet;
            document.getElementById('start-btn').textContent = 'Start Next Set';
            document.getElementById('start-btn').classList.remove('hidden');
            playSound('success');
        }
    }

    completeGame() {
        const formBonus = this.perfectSquats * 10;
        const totalPoints = this.levelData.points + formBonus;
        
        playSound('levelUp');
        this.showCompletionDialog(totalPoints, formBonus);
    }

    showCompletionDialog(totalPoints, formBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Exercise Complete! 🎉</h2>
                <div class="stats-summary">
                    <p>Sets Completed: ${this.levelData.sets}</p>
                    <p>Total Reps: ${this.levelData.sets * this.levelData.reps}</p>
                    <p>Perfect Squats: ${this.perfectSquats}</p>
                </div>
                <div class="points-breakdown">
                    <p>Base Points: ${this.levelData.points}</p>
                    <p>Form Bonus: +${formBonus}</p>
                    <p class="total-points">Total Points: ${totalPoints}</p>
                </div>
                <button onclick="updateScore(${totalPoints})" class="game-button">Continue</button>
            </div>
        `;
        document.getElementById('active-game-container').appendChild(dialog);
    }

    showFormWarning() {
        const character = document.getElementById('character');
        character.classList.add('warning');
        setTimeout(() => character.classList.remove('warning'), 500);
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Swimming Game
class SwimmingGame {
    constructor(level) {
        this.level = level;
        this.levelData = physicalGames.swim.levels[level - 1];
        this.laps = 0;
        this.strokes = 0;
        this.isActive = false;
        this.strokeTimes = [];
        this.perfectStrokes = 0;
        this.currentDirection = 'right';
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="swimming-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="level-info">Level ${this.level}</div>
                </div>

                <div class="game-stats">
                    <div class="stat">
                        <i class="fas fa-swimming-pool"></i>
                        Laps: <span id="current-laps">${this.laps}</span>/${this.levelData.laps}
                    </div>
                    <div class="stat">
                        <i class="fas fa-water"></i>
                        Style: ${this.levelData.style}
                    </div>
                    <div class="stat">
                        <i class="fas fa-star"></i>
                        Perfect: <span id="perfect-strokes">${this.perfectStrokes}</span>
                    </div>
                </div>

                <div class="pool-area">
                    <div class="lane-markers"></div>
                    <div id="swimmer" class="swimmer">🏊</div>
                    <div class="water-effect"></div>
                </div>

                <div class="stroke-meter">
                    <div id="rhythm-bar" class="rhythm-bar"></div>
                    <div class="rhythm-marks">
                        <span>Too Slow</span>
                        <span>Perfect</span>
                        <span>Too Fast</span>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Swimming</button>
                    <div class="instructions">
                        <p>Press SPACE alternately for arm strokes</p>
                        <p>Maintain rhythm for perfect form</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('start-btn').addEventListener('click', () => this.startSwimming());
        this.createWaterEffect();
    }

    createWaterEffect() {
        const waves = document.querySelector('.water-effect');
        for (let i = 0; i < 10; i++) {
            const wave = document.createElement('div');
            wave.className = 'wave';
            wave.style.animationDelay = `${i * 0.2}s`;
            waves.appendChild(wave);
        }
    }

    bindEvents() {
        this.handleKeyPress = (e) => {
            if (e.code === 'Space' && this.isActive) {
                e.preventDefault();
                this.stroke();
            }
        };
        document.addEventListener('keydown', this.handleKeyPress);
    }

    startSwimming() {
        this.isActive = true;
        document.getElementById('start-btn').classList.add('hidden');
        playSound('newLevel');
    }

    stroke() {
        if (!this.isActive) return;

        const now = Date.now();
        const strokeInterval = now - (this.lastStrokeTime || now);
        
        if (strokeInterval > 300) { // Prevent too rapid strokes
            this.lastStrokeTime = now;
            this.strokeTimes.push(strokeInterval);
            this.strokes++;
            
            const rhythmQuality = this.calculateRhythm(strokeInterval);
            this.updateStrokeVisuals(rhythmQuality);
            this.moveSwimmer();

            if (this.strokes % 10 === 0) {
                this.completeLap();
            }
        }
    }

    calculateRhythm(interval) {
        // Ideal stroke interval: 1000ms
        const idealInterval = 1000;
        const variance = Math.abs(interval - idealInterval);
        return Math.max(0, 100 - (variance / 10));
    }

    updateStrokeVisuals(rhythmQuality) {
        const rhythmBar = document.getElementById('rhythm-bar');
        rhythmBar.style.width = `${rhythmQuality}%`;
        
        if (rhythmQuality >= 90) {
            this.perfectStrokes++;
            document.getElementById('perfect-strokes').textContent = this.perfectStrokes;
            rhythmBar.className = 'rhythm-bar perfect';
            playSound('goodResult');
        } else if (rhythmQuality >= 70) {
            rhythmBar.className = 'rhythm-bar good';
        } else {
            rhythmBar.className = 'rhythm-bar poor';
        }
    }

    moveSwimmer() {
        const swimmer = document.getElementById('swimmer');
        const poolWidth = document.querySelector('.pool-area').offsetWidth - swimmer.offsetWidth;
        let currentPosition = parseFloat(swimmer.style.left) || 0;

        if (this.currentDirection === 'right') {
            currentPosition += 10;
            if (currentPosition >= 100) {
                this.currentDirection = 'left';
                swimmer.style.transform = 'scaleX(-1)';
            }
        } else {
            currentPosition -= 10;
            if (currentPosition <= 0) {
                this.currentDirection = 'right';
                swimmer.style.transform = 'scaleX(1)';
            }
        }

        swimmer.style.left = `${currentPosition}%`;
        this.createSplash(swimmer);
    }

    createSplash(swimmer) {
        const splash = document.createElement('div');
        splash.className = 'splash';
        splash.style.left = swimmer.style.left;
        splash.style.top = swimmer.style.top;
        document.querySelector('.pool-area').appendChild(splash);
        setTimeout(() => splash.remove(), 1000);
    }

    completeLap() {
        this.laps++;
        document.getElementById('current-laps').textContent = this.laps;

        if (this.laps >= this.levelData.laps) {
            this.completeGame();
        } else {
            playSound('success');
        }
    }

    completeGame() {
        this.isActive = false;
        const rhythmBonus = Math.floor(this.perfectStrokes * 5);
        const totalPoints = this.levelData.points + rhythmBonus;
        
        playSound('levelUp');
        this.showCompletionDialog(totalPoints, rhythmBonus);
    }

    showCompletionDialog(totalPoints, rhythmBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Swimming Complete! 🎉</h2>
                <div class="stats-summary">
                    <p>Laps Completed: ${this.laps}</p>
                    <p>Perfect Strokes: ${this.perfectStrokes}</p>
                    <p>Swimming Style: ${this.levelData.style}</p>
                </div>
                <div class="points-breakdown">
                    <p>Base Points: ${this.levelData.points}</p>
                    <p>Rhythm Bonus: +${rhythmBonus}</p>
                    <p class="total-points">Total Points: ${totalPoints}</p>
                </div>
                <button onclick="updateScore(${totalPoints})" class="game-button">Continue</button>
            </div>
        `;
        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Export all game classes and configurations
window.physicalGames = physicalGames;
window.startPhysicalGame = startPhysicalGame;
window.RunningGame = RunningGame;
window.SquatGame = SquatGame;
window.SwimmingGame = SwimmingGame;
