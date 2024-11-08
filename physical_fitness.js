// Physical Fitness Games Configuration and Implementation

// Game Configurations
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
            { reps: 10, sets: 2, points: 150, name: "Basic Squat Training" },
            { reps: 15, sets: 3, points: 250, name: "Power Squats" },
            { reps: 20, sets: 3, points: 350, name: "Ultimate Squat Challenge" }
        ]
    },
    swim: {
        id: 'swim',
        name: "Lane Swimmer",
        icon: '🏊',
        description: "Swimming exercises for full body workout",
        unlockLevel: 3,
        levels: [
            { laps: 4, style: 'freestyle', points: 200, name: "Freestyle Basics" },
            { laps: 6, style: 'mixed', points: 300, name: "Mixed Stroke Challenge" },
            { laps: 8, style: 'advanced', points: 400, name: "Pro Swimmer" }
        ]
    }
};

// Running Game Class
class RunningGame {
    constructor(level) {
        this.level = level;
        this.levelData = physicalGames.run.levels[level - 1];
        this.distance = 0;
        this.timeLeft = this.levelData.time;
        this.isActive = false;
        this.timer = null;
        this.keyPressCount = 0;
        this.lastKeyPress = 0;
        this.steps = [];
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="running-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <div class="stat-item">
                            <i class="fas fa-running"></i>
                            <span id="distance-display">0</span> / ${this.levelData.distance}m
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-clock"></i>
                            <span id="time-display">${formatTime(this.timeLeft)}</span>
                        </div>
                    </div>
                </div>

                <div class="running-track">
                    <div id="runner" class="runner">🏃</div>
                    <div class="track-marks"></div>
                </div>

                <div class="control-panel">
                    <button id="start-btn" class="primary-btn">Start Running!</button>
                    <button id="pause-btn" class="secondary-btn hidden">Pause</button>
                </div>

                <div class="instructions">
                    <p>Press SPACE repeatedly to run!</p>
                    <p>Maintain a steady rhythm for bonus points</p>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startExercise());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseExercise());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startExercise() {
        this.isActive = true;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('pause-btn').classList.remove('hidden');
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endExercise();
            }
        }, 1000);

        playSound('newLevel');
    }

    pauseExercise() {
        this.isActive = false;
        clearInterval(this.timer);
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('start-btn').textContent = 'Resume';
    }

    handleKeyPress(event) {
        if (!this.isActive || event.code !== 'Space') return;
        event.preventDefault();

        const now = Date.now();
        const timeSinceLastPress = now - this.lastKeyPress;

        if (timeSinceLastPress > 200) { // Prevent too rapid keypresses
            this.incrementDistance();
            this.lastKeyPress = now;
            this.steps.push(timeSinceLastPress);
            this.animateRunner();
        }
    }

    incrementDistance() {
        this.distance += 10;
        this.updateDistance();
        this.checkProgress();
    }

    updateDistance() {
        document.getElementById('distance-display').textContent = this.distance;
        const progressPercentage = (this.distance / this.levelData.distance) * 100;
        document.getElementById('runner').style.left = `${Math.min(progressPercentage, 100)}%`;
    }

    updateTimer() {
        document.getElementById('time-display').textContent = formatTime(this.timeLeft);
    }

    animateRunner() {
        const runner = document.getElementById('runner');
        runner.classList.add('running-animation');
        setTimeout(() => runner.classList.remove('running-animation'), 150);
    }

    checkProgress() {
        if (this.distance >= this.levelData.distance) {
            this.completeExercise();
        }
    }

    calculateStepConsistency() {
        if (this.steps.length < 2) return 100;
        
        const intervals = this.steps.slice(1);
        const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const variance = intervals.reduce((acc, val) => acc + Math.abs(val - averageInterval), 0) / intervals.length;
        
        return Math.max(0, 100 - (variance / 10));
    }

    completeExercise() {
        this.isActive = false;
        clearInterval(this.timer);
        
        const timeBonus = Math.floor(this.timeLeft / 2);
        const consistencyBonus = Math.floor(this.calculateStepConsistency());
        const totalPoints = this.levelData.points + timeBonus + consistencyBonus;

        playSound('success');
        this.showCompletionDialog(totalPoints, timeBonus, consistencyBonus);
    }

    endExercise() {
        this.isActive = false;
        clearInterval(this.timer);

        if (this.distance >= this.levelData.distance) {
            this.completeExercise();
        } else {
            playSound('fail');
            this.showFailureDialog();
        }
    }

    showCompletionDialog(totalPoints, timeBonus, consistencyBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Exercise Complete! 🎉</h2>
                <div class="stats-summary">
                    <div class="stat">Distance Covered: ${this.distance}m</div>
                    <div class="stat">Time Remaining: ${this.timeLeft}s</div>
                    <div class="stat">Running Consistency: ${Math.floor(this.calculateStepConsistency())}%</div>
                </div>
                <div class="points-breakdown">
                    <div class="point-item">Base Points: ${this.levelData.points}</div>
                    <div class="point-item">Time Bonus: +${timeBonus}</div>
                    <div class="point-item">Consistency Bonus: +${consistencyBonus}</div>
                    <div class="total-points">Total Points: ${totalPoints}</div>
                </div>
                <button onclick="gameManager.completeGame(${totalPoints})" class="primary-btn">Continue</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    showFailureDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog failure';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Time's Up! ⏰</h2>
                <div class="stats-summary">
                    <div class="stat">Distance Covered: ${this.distance}m</div>
                    <div class="stat">Target Distance: ${this.levelData.distance}m</div>
                    <div class="stat">Completion: ${Math.floor((this.distance / this.levelData.distance) * 100)}%</div>
                </div>
                <div class="action-buttons">
                    <button onclick="gameManager.retryGame()" class="primary-btn">Try Again</button>
                    <button onclick="gameManager.exitGame()" class="secondary-btn">Exit</button>
                </div>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    cleanup() {
        clearInterval(this.timer);
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Squat Game Class
class SquatGame {
    constructor(level) {
        this.level = level;
        this.levelData = physicalGames.squat.levels[level - 1];
        this.currentSet = 1;
        this.reps = 0;
        this.isActive = false;
        this.inSquat = false;
        this.setStartTime = 0;
        this.repTimes = [];
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="squat-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <div class="stat-item">Set ${this.currentSet}/${this.levelData.sets}</div>
                        <div class="stat-item">Rep ${this.reps}/${this.levelData.reps}</div>
                    </div>
                </div>

                <div class="exercise-area">
                    <div id="character" class="character-sprite standing"></div>
                    <div class="form-guide">
                        <div class="guide-text" id="guide-text">Press SPACE to squat</div>
                        <div class="form-meter" id="form-meter"></div>
                    </div>
                </div>

                <div class="control-panel">
                    <button id="start-btn" class="primary-btn">Start Set</button>
                    <button id="rest-btn" class="secondary-btn hidden">Take a Break</button>
                </div>

                <div class="instructions">
                    <p>Hold SPACE to squat down, release to stand up</p>
                    <p>Maintain proper form for maximum points</p>
                    <p>Rest between sets for better performance</p>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startSet());
        document.getElementById('rest-btn').addEventListener('click', () => this.takeRest());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    startSet() {
        this.isActive = true;
        this.setStartTime = Date.now();
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('guide-text').textContent = 'Ready to squat!';
        playSound('newLevel');
    }

    handleKeyDown(event) {
        if (!this.isActive || event.code !== 'Space' || this.inSquat) return;
        event.preventDefault();
        
        this.startSquat();
    }

    handleKeyUp(event) {
        if (!this.isActive || event.code !== 'Space' || !this.inSquat) return;
        event.preventDefault();
        
        this.completeSquat();
    }

    startSquat() {
        this.inSquat = true;
        const character = document.getElementById('character');
        character.classList.remove('standing');
        character.classList.add('squatting');
        
        this.squatStartTime = Date.now();
        this.startFormCheck();
    }

    completeSquat() {
        if (!this.inSquat) return;
        
        const squatDuration = Date.now() - this.squatStartTime;
        const formScore = this.calculateFormScore(squatDuration);
        
        this.inSquat = false;
        const character = document.getElementById('character');
        character.classList.remove('squatting');
        character.classList.add('standing');
        
        if (formScore >= 70) {
            this.countRep();
            this.repTimes.push(squatDuration);
        } else {
            this.showFormWarning();
        }
    }

    calculateFormScore(duration) {
        // Ideal squat duration: 2-3 seconds
        const idealDuration = 2500;
        const variance = Math.abs(duration - idealDuration);
        return Math.max(0, 100 - (variance / 50));
    }

    startFormCheck() {
        const formMeter = document.getElementById('form-meter');
        let checkInterval = setInterval(() => {
            if (!this.inSquat) {
                clearInterval(checkInterval);
                formMeter.style.width = '0%';
                return;
            }
            
            const duration = Date.now() - this.squatStartTime;
            const formScore = this.calculateFormScore(duration);
            formMeter.style.width = `${formScore}%`;
            formMeter.style.backgroundColor = formScore >= 70 ? '#4CAF50' : '#FF5252';
        }, 100);
    }

    countRep() {
        this.reps++;
        playSound('goodResult');
        
        if (this.reps >= this.levelData.reps) {
            this.completeSet();
        } else {
            this.updateUI();
        }
    }

    completeSet() {
        this.isActive = false;
        
        if (this.currentSet >= this.levelData.sets) {
            this.completeExercise();
        } else {
            this.currentSet++;
            this.reps = 0;
            this.showRestPrompt();
        }
    }

    showRestPrompt() {
        document.getElementById('rest-btn').classList.remove('hidden');
        document.getElementById('guide-text').textContent = 'Take a short rest!';
    }

    takeRest() {
        document.getElementById('rest-btn').classList.add('hidden');
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('start-btn').textContent = 'Start Next Set';
        
        setTimeout(() => {
            if (!this.isActive) {
                document.getElementById('guide-text').textContent = 'Ready for next set!';
            }
        }, 3000);
    }

    completeExercise() {
        const formScore = this.calculateAverageForm();
        const timeBonus = this.calculateTimeBonus();
        const totalPoints = this.levelData.points + formScore + timeBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, formScore, timeBonus);
    }

    calculateAverageForm() {
        if (this.repTimes.length === 0) return 0;
        const avgTime = this.repTimes.reduce((a, b) => a + b) / this.repTimes.length;
        return Math.floor(this.calculateFormScore(avgTime));
    }

    calculateTimeBonus() {
        const totalTime = (Date.now() - this.setStartTime) / 1000;
        const expectedTime = this.levelData.sets * this.levelData.reps * 3; // 3 seconds per rep
        return Math.max(0, Math.floor((expectedTime - totalTime) / 2));
    }

    showCompletionDialog(totalPoints, formScore, timeBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Exercise Complete! 🎉</h2>
                <div class="stats-summary">
                    <div class="stat">Sets Completed: ${this.levelData.sets}</div>
                    <div class="stat">Total Reps: ${this.levelData.sets * this.levelData.reps}</div>
                    <div class="stat">Form Score: ${formScore}%</div>
                </div>
                <div class="points-breakdown">
                    <div class="point-item">Base Points: ${this.levelData.points}</div>
                    <div class="point-item">Form Bonus: +${formScore}</div>
                    <div class="point-item">Time Bonus: +${timeBonus}</div>
                    <div class="total-points">Total Points: ${totalPoints}</div>
                </div>
                <button onclick="gameManager.completeGame(${totalPoints})" class="primary-btn">Continue</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    showFormWarning() {
        const guideText = document.getElementById('guide-text');
        guideText.textContent = 'Maintain proper form!';
        guideText.classList.add('warning');
        setTimeout(() => {
            guideText.classList.remove('warning');
            guideText.textContent = 'Try again!';
        }, 1000);
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Swimming Game Class
class SwimmingGame {
    constructor(level) {
        this.level = level;
        this.levelData = physicalGames.swim.levels[level - 1];
        this.currentLap = 0;
        this.strokes = 0;
        this.isActive = false;
        this.strokeTimes = [];
        this.lapTimes = [];
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="swimming-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <div class="stat-item">Lap ${this.currentLap + 1}/${this.levelData.laps}</div>
                        <div class="stat-item">Style: ${this.levelData.style}</div>
                    </div>
                </div>

                <div class="pool-area">
                    <div class="lane-markers"></div>
                    <div id="swimmer" class="swimmer"></div>
                    <div class="water-effect"></div>
                </div>

                <div class="stroke-meter">
                    <div id="rhythm-bar" class="rhythm-bar"></div>
                    <div class="stroke-guide">
                        <div class="guide-mark perfect"></div>
                        <div class="guide-mark good"></div>
                        <div class="guide-mark poor"></div>
                    </div>
                </div>

                <div class="control-panel">
                    <button id="start-btn" class="primary-btn">Start Swimming!</button>
                    <div id="stroke-info" class="stroke-info hidden">
                        Press SPACE alternately for arm strokes
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startSwimming());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startSwimming() {
        this.isActive = true;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('stroke-info').classList.remove('hidden');
        this.startTime = Date.now();
        this.animateWater();
        playSound('newLevel');
    }

    handleKeyPress(event) {
        if (!this.isActive || event.code !== 'Space') return;
        event.preventDefault();

        const now = Date.now();
        const strokeInterval = now - (this.lastStrokeTime || now);
        this.lastStrokeTime = now;

        if (strokeInterval > 300) { // Prevent too rapid strokes
            this.stroke(strokeInterval);
        }
    }

    stroke(interval) {
        this.strokes++;
        this.strokeTimes.push(interval);
        this.moveSwimmer();
        this.updateRhythmMeter(interval);

        if (this.strokes % 10 === 0) { // Every 10 strokes completes a lap
            this.completeLap();
        }
    }

    moveSwimmer() {
        const swimmer = document.getElementById('swimmer');
        const progress = (this.strokes % 10) / 10;
        const direction = Math.floor(this.strokes / 10) % 2 === 0 ? 1 : -1;
        
        swimmer.style.left = direction > 0 ? 
            `${progress * 100}%` : 
            `${(1 - progress) * 100}%`;
        
        swimmer.classList.toggle('stroke-left', this.strokes % 2 === 0);
    }

    updateRhythmMeter(interval) {
        const rhythmBar = document.getElementById('rhythm-bar');
        const rhythm = this.calculateRhythm(interval);
        
        rhythmBar.style.width = `${rhythm}%`;
        rhythmBar.className = `rhythm-bar ${this.getRhythmClass(rhythm)}`;
    }

    calculateRhythm(interval) {
        // Ideal stroke interval: 1000ms
        const idealInterval = 1000;
        const variance = Math.abs(interval - idealInterval);
        return Math.max(0, 100 - (variance / 10));
    }

    getRhythmClass(rhythm) {
        if (rhythm >= 90) return 'perfect';
        if (rhythm >= 70) return 'good';
        return 'poor';
    }

    completeLap() {
        this.currentLap++;
        this.lapTimes.push(Date.now() - (this.lastLapTime || this.startTime));
        this.lastLapTime = Date.now();

        if (this.currentLap >= this.levelData.laps) {
            this.completeExercise();
        } else {
            playSound('goodResult');
            this.updateUI();
        }
    }

    updateUI() {
        const lapDisplay = document.querySelector('.stat-item');
        lapDisplay.textContent = `Lap ${this.currentLap + 1}/${this.levelData.laps}`;
    }

    completeExercise() {
        this.isActive = false;
        const rhythmScore = this.calculateAverageRhythm();
        const timeBonus = this.calculateTimeBonus();
        const totalPoints = this.levelData.points + rhythmScore + timeBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, rhythmScore, timeBonus);
    }

    calculateAverageRhythm() {
        if (this.strokeTimes.length <= 1) return 0;
        const intervals = this.strokeTimes.slice(1);
        return Math.floor(
            intervals.reduce((sum, interval) => sum + this.calculateRhythm(interval), 0) / 
            intervals.length
        );
    }

    calculateTimeBonus() {
        const totalTime = (Date.now() - this.startTime) / 1000;
        const expectedTime = this.levelData.laps * 30; // 30 seconds per lap
        return Math.max(0, Math.floor((expectedTime - totalTime) / 3));
    }

    showCompletionDialog(totalPoints, rhythmScore, timeBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Exercise Complete! 🎉</h2>
                <div class="stats-summary">
                    <div class="stat">Laps Completed: ${this.levelData.laps}</div>
                    <div class="stat">Swimming Style: ${this.levelData.style}</div>
                    <div class="stat">Stroke Rhythm: ${rhythmScore}%</div>
                </div>
                <div class="points-breakdown">
                    <div class="point-item">Base Points: ${this.levelData.points}</div>
                    <div class="point-item">Rhythm Bonus: +${rhythmScore}</div>
                    <div class="point-item">Time Bonus: +${timeBonus}</div>
                    <div class="total-points">Total Points: ${totalPoints}</div>
                </div>
                <button onclick="gameManager.completeGame(${totalPoints})" class="primary-btn">Continue</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    animateWater() {
        const waterEffect = document.querySelector('.water-effect');
        waterEffect.style.animation = 'water-ripple 2s infinite linear';
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// Export game classes and configurations
window.physicalGames = physicalGames;
window.RunningGame = RunningGame;
window.SquatGame = SquatGame;
window.SwimmingGame = SwimmingGame;