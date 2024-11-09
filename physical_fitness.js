// Runner's Challenge Game
class RunnerGame extends PhysicalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = PHYSICAL_GAMES.runner.levels[level - 1];
        this.distance = 0;
        this.speed = 5;
        this.isJumping = false;
        this.score = 0;
        this.obstacles = [];
        this.gameLoop = null;
        this.character = {
            y: 0,
            jumpForce: 0,
            isGrounded: true
        };
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="runner-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <span>Distance: <span id="distance">0</span>/${this.levelData.distance}m</span>
                        <span>Score: <span id="score">0</span></span>
                        <span>Speed: <span id="speed">5</span> m/s</span>
                    </div>
                </div>
                <div class="game-area">
                    <div class="runner-character">🏃</div>
                    <div class="track">
                        <div class="obstacle-container"></div>
                        <div class="track-line"></div>
                    </div>
                </div>
                <div class="controls">
                    <button class="game-button start-btn">Start Running</button>
                    <div class="instructions">
                        <p>Press SPACE to jump over obstacles</p>
                        <p>Press ↑↓ to adjust speed</p>
                    </div>
                </div>
            </div>
        `;

        this.setupGame();
    }

    setupGame() {
        this.trackElement = document.querySelector('.track');
        this.characterElement = document.querySelector('.runner-character');
        this.obstacleContainer = document.querySelector('.obstacle-container');
        
        document.querySelector('.start-btn').addEventListener('click', () => this.startGame());
    }

    bindEvents() {
        this.handleKeyDown = (e) => {
            if (!this.isActive) return;

            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.jump();
                    break;
                case 'ArrowUp':
                    this.adjustSpeed(1);
                    break;
                case 'ArrowDown':
                    this.adjustSpeed(-1);
                    break;
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);
    }

    startGame() {
        this.isActive = true;
        document.querySelector('.start-btn').style.display = 'none';
        this.audioManager.play('NewLevel');
        this.startGameLoop();
        this.spawnObstacles();
    }

    startGameLoop() {
        let lastTime = 0;
        const gameLoop = (timestamp) => {
            if (!this.isActive) return;

            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            this.updateGame(deltaTime);
            this.gameLoop = requestAnimationFrame(gameLoop);
        };

        this.gameLoop = requestAnimationFrame(gameLoop);
    }

    updateGame(deltaTime) {
        // Update distance
        this.distance += this.speed * (deltaTime / 1000);
        document.getElementById('distance').textContent = Math.floor(this.distance);

        // Update character
        if (!this.character.isGrounded) {
            this.character.y += this.character.jumpForce * (deltaTime / 1000);
            this.character.jumpForce -= 980 * (deltaTime / 1000); // Gravity

            if (this.character.y <= 0) {
                this.character.y = 0;
                this.character.isGrounded = true;
                this.character.jumpForce = 0;
            }

            this.characterElement.style.bottom = `${this.character.y}px`;
        }

        // Update obstacles
        this.updateObstacles(deltaTime);

        // Check win condition
        if (this.distance >= this.levelData.distance) {
            this.completeGame();
        }
    }

    jump() {
        if (this.character.isGrounded) {
            this.character.isGrounded = false;
            this.character.jumpForce = 400;
            this.audioManager.play('GoodResult');
        }
    }

    adjustSpeed(change) {
        this.speed = Math.max(3, Math.min(8, this.speed + change));
        document.getElementById('speed').textContent = this.speed;
    }

    spawnObstacles() {
        const spawnObstacle = () => {
            if (!this.isActive) return;

            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.textContent = '🚧';
            obstacle.style.left = '100%';
            this.obstacleContainer.appendChild(obstacle);

            this.obstacles.push({
                element: obstacle,
                position: 100,
                passed: false
            });

            const nextSpawn = gameUtils.MathUtils.randomBetween(2000, 4000);
            setTimeout(spawnObstacle, nextSpawn);
        };

        setTimeout(spawnObstacle, 2000);
    }

    updateObstacles(deltaTime) {
        this.obstacles.forEach((obstacle, index) => {
            obstacle.position -= this.speed * (deltaTime / 1000) * 50;
            obstacle.element.style.left = `${obstacle.position}%`;

            // Check collision
            if (!obstacle.passed && obstacle.position < 20 && obstacle.position > 10) {
                const characterBox = this.characterElement.getBoundingClientRect();
                const obstacleBox = obstacle.element.getBoundingClientRect();

                if (this.checkCollision(characterBox, obstacleBox)) {
                    this.handleCollision();
                } else if (!obstacle.passed && obstacle.position < 15) {
                    obstacle.passed = true;
                    this.addScore(10);
                }
            }

            // Remove off-screen obstacles
            if (obstacle.position < -10) {
                obstacle.element.remove();
                this.obstacles.splice(index, 1);
            }
        });
    }

    checkCollision(char, obs) {
        return !(char.bottom < obs.top || 
                char.top > obs.bottom || 
                char.right < obs.left || 
                char.left > obs.right);
    }

    handleCollision() {
        this.speed = Math.max(3, this.speed - 1);
        document.getElementById('speed').textContent = this.speed;
        this.audioManager.play('Fail');
        this.characterElement.classList.add('hit');
        setTimeout(() => this.characterElement.classList.remove('hit'), 500);
    }

    addScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        gameUtils.UIUtils.showNotification(`+${points} points!`, 'success');
    }

    completeGame() {
        this.isActive = false;
        cancelAnimationFrame(this.gameLoop);
        
        const speedBonus = Math.floor(this.speed * 10);
        const obstacleBonus = this.score;
        const totalPoints = this.levelData.points + speedBonus + obstacleBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Level Complete! 🎉",
            {
                "Distance": `${Math.floor(this.distance)}m`,
                "Average Speed": `${this.speed} m/s`,
                "Obstacles Cleared": Math.floor(this.score / 10)
            },
            {
                "Base Points": this.levelData.points,
                "Speed Bonus": speedBonus,
                "Obstacle Bonus": obstacleBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        super.cleanup();
        cancelAnimationFrame(this.gameLoop);
        this.obstacles.forEach(obstacle => obstacle.element.remove());
        this.obstacles = [];
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
            // Add other games here
            default:
                throw new Error(`Unknown game: ${gameId}`);
        }
    }
}

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

// Lane Swimmer Game
class SwimGame extends PhysicalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = PHYSICAL_GAMES.swim.levels[level - 1];
        this.laps = 0;
        this.strokes = 0;
        this.perfectStrokes = 0;
        this.currentStyle = this.levelData.style;
        this.position = { x: 0, direction: 1 };
        this.strokePattern = [];
        this.currentPattern = 0;
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="swim-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <span>Laps: <span id="current-laps">${this.laps}</span>/${this.levelData.laps}</span>
                        <span>Style: <span id="swim-style">${this.currentStyle}</span></span>
                        <span>Perfect: <span id="perfect-strokes">${this.perfectStrokes}</span></span>
                    </div>
                </div>

                <div class="pool-container">
                    <div class="pool">
                        <div class="lane-markers"></div>
                        <div id="swimmer" class="swimmer">🏊</div>
                        <div id="ripples" class="ripples"></div>
                        <div class="water-overlay"></div>
                    </div>

                    <div class="stroke-rhythm">
                        <div class="pattern-display">
                            <div id="pattern-sequence" class="pattern-sequence"></div>
                            <div id="current-key" class="current-key"></div>
                        </div>
                        <div class="rhythm-meter">
                            <div id="rhythm-bar" class="rhythm-bar"></div>
                        </div>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Swimming</button>
                    <div class="instructions">
                        <p>Follow the stroke pattern shown</p>
                        <p>Press keys in rhythm for perfect form</p>
                        <p class="pattern-help"></p>
                    </div>
                </div>
            </div>
        `;

        this.setupPool();
    }

    setupPool() {
        // Create lane markers
        const laneMarkers = document.querySelector('.lane-markers');
        for (let i = 0; i < 8; i++) {
            const marker = document.createElement('div');
            marker.className = 'lane-marker';
            laneMarkers.appendChild(marker);
        }

        // Create water effect
        const waterOverlay = document.querySelector('.water-overlay');
        for (let i = 0; i < 5; i++) {
            const wave = document.createElement('div');
            wave.className = 'wave';
            wave.style.animationDelay = `${i * 0.5}s`;
            waterOverlay.appendChild(wave);
        }

        this.swimmer = document.getElementById('swimmer');
        this.ripples = document.getElementById('ripples');
        this.startButton = document.getElementById('start-btn');
        this.startButton.addEventListener('click', () => this.startSwimming());

        this.generateSwimPattern();
    }

    generateSwimPattern() {
        const patterns = {
            'freestyle': ['ArrowLeft', 'ArrowRight'],
            'mixed': ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'],
            'advanced': ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']
        };

        this.strokePattern = patterns[this.levelData.style];
        this.updatePatternDisplay();
        document.querySelector('.pattern-help').textContent = 
            `Keys: ${this.strokePattern.join(' → ')}`;
    }

    updatePatternDisplay() {
        const sequence = document.getElementById('pattern-sequence');
        sequence.innerHTML = this.strokePattern.map((key, index) => `
            <div class="pattern-key ${index === this.currentPattern ? 'current' : ''}">${
                this.getKeySymbol(key)
            }</div>
        `).join('');
    }

    getKeySymbol(key) {
        const symbols = {
            'ArrowLeft': '⬅️',
            'ArrowRight': '➡️',
            'ArrowUp': '⬆️',
            'ArrowDown': '⬇️',
            'Space': '⭐'
        };
        return symbols[key] || key;
    }

    startSwimming() {
        this.isActive = true;
        this.startButton.style.display = 'none';
        this.audioManager.play('NewLevel');
        this.startSwimAnimation();
    }

    bindEvents() {
        this.handleKeyDown = (e) => {
            if (!this.isActive) return;
            
            if (this.strokePattern.includes(e.code)) {
                e.preventDefault();
                this.handleStroke(e.code);
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);
    }

    handleStroke(key) {
        const expectedKey = this.strokePattern[this.currentPattern];
        const isCorrect = key === expectedKey;
        
        if (isCorrect) {
            this.swim();
            this.currentPattern = (this.currentPattern + 1) % this.strokePattern.length;
            this.updatePatternDisplay();
        } else {
            this.showStrokeError();
        }
    }

    swim() {
        // Move swimmer
        this.position.x += 5 * this.position.direction;
        this.swimmer.style.left = `${this.position.x}%`;

        // Create ripple effect
        this.createRipple();

        // Check for perfect timing
        const timing = this.checkTiming();
        if (timing >= 0.8) {
            this.perfectStrokes++;
            document.getElementById('perfect-strokes').textContent = this.perfectStrokes;
            this.audioManager.play('GoodResult');
        } else {
            this.audioManager.play('Success');
        }

        // Check for lap completion
        if (this.position.x >= 90 || this.position.x <= 0) {
            this.completeLap();
        }
    }

    createRipple() {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${this.position.x}%`;
        this.ripples.appendChild(ripple);

        setTimeout(() => ripple.remove(), 1000);
    }

    checkTiming() {
        // Check stroke timing based on rhythm meter
        const rhythmBar = document.getElementById('rhythm-bar');
        const currentWidth = parseInt(rhythmBar.style.width) || 0;
        
        // Oscillate rhythm bar
        const oscillate = () => {
            let width = 0;
            const animate = () => {
                if (!this.isActive) return;
                width = (width + 2) % 200;
                const displayWidth = width <= 100 ? width : 200 - width;
                rhythmBar.style.width = `${displayWidth}%`;
                requestAnimationFrame(animate);
            };
            animate();
        };
        oscillate();

        return Math.max(0, 1 - Math.abs(50 - currentWidth) / 50);
    }

    showStrokeError() {
        this.swimmer.classList.add('stroke-error');
        this.audioManager.play('Fail');
        setTimeout(() => this.swimmer.classList.remove('stroke-error'), 500);
    }

    completeLap() {
        this.laps++;
        document.getElementById('current-laps').textContent = this.laps;

        if (this.laps >= this.levelData.laps) {
            this.completeGame();
        } else {
            // Turn around
            this.position.direction *= -1;
            this.swimmer.style.transform = `scaleX(${this.position.direction})`;
            this.audioManager.play('Success');
        }
    }

    completeGame() {
        const rhythmBonus = this.perfectStrokes * 10;
        const styleBonus = this.levelData.style === 'advanced' ? 100 : 
                          this.levelData.style === 'mixed' ? 50 : 0;
        const totalPoints = this.levelData.points + rhythmBonus + styleBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Swimming Complete! 🎉",
            {
                "Laps": `${this.laps}/${this.levelData.laps}`,
                "Perfect Strokes": this.perfectStrokes,
                "Style": this.levelData.style
            },
            {
                "Base Points": this.levelData.points,
                "Rhythm Bonus": rhythmBonus,
                "Style Bonus": styleBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        super.cleanup();
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// Update PhysicalGameFactory
class PhysicalGameFactory {
    static createGame(gameId, level, gameManager) {
        switch(gameId) {
            case 'hoops':
                return new HoopsGame(level, gameManager);
            case 'runner':
                return new RunnerGame(level, gameManager);
            case 'squat':
                return new SquatGame(level, gameManager);
            case 'swim':
                return new SwimGame(level, gameManager);
            default:
                throw new Error(`Unknown game: ${gameId}`);
        }
    }
}

// Cycling Challenge Game
class CycleGame extends PhysicalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = PHYSICAL_GAMES.cycle.levels[level - 1];
        this.distance = 0;
        this.speed = 0;
        this.energy = 100;
        this.balance = 50; // Center position
        this.perfectPedals = 0;
        this.terrain = this.generateTerrain();
        this.pedalPattern = [];
        this.lastPedalTime = 0;
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="cycle-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <span>Distance: <span id="distance">0</span>/${this.levelData.distance}m</span>
                        <span>Speed: <span id="speed">0</span> km/h</span>
                        <span>Perfect: <span id="perfect-pedals">0</span></span>
                    </div>
                </div>

                <div class="cycle-view">
                    <div class="terrain-background">
                        <div class="sky-gradient"></div>
                        <div class="terrain-path"></div>
                    </div>
                    
                    <div class="game-indicators">
                        <div class="meter energy-meter">
                            <label>Energy</label>
                            <div class="meter-bar">
                                <div id="energy-bar" class="meter-fill" style="width: 100%"></div>
                            </div>
                        </div>
                        
                        <div class="meter balance-meter">
                            <label>Balance</label>
                            <div class="meter-bar">
                                <div id="balance-marker" class="balance-indicator"></div>
                                <div class="perfect-zone"></div>
                            </div>
                        </div>
                    </div>

                    <div class="cyclist-container">
                        <div id="cyclist" class="cyclist">🚴</div>
                        <div class="pedal-feedback" id="pedal-feedback"></div>
                    </div>

                    <div class="terrain-elements"></div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Cycling</button>
                    <div class="instructions">
                        <p>Press LEFT/RIGHT arrows to maintain balance</p>
                        <p>Press SPACE rhythmically to pedal</p>
                        <p>Watch your energy on uphills!</p>
                    </div>
                </div>

                <div class="status-overlay" id="status-overlay"></div>
            </div>
        `;

        this.setupGame();
    }

    setupGame() {
        this.cyclist = document.getElementById('cyclist');
        this.energyBar = document.getElementById('energy-bar');
        this.balanceMarker = document.getElementById('balance-marker');
        this.statusOverlay = document.getElementById('status-overlay');
        this.terrainElements = document.querySelector('.terrain-elements');
        
        this.renderTerrain();
        this.bindEvents();
        
        document.getElementById('start-btn').addEventListener('click', () => this.startCycling());
    }

    generateTerrain() {
        const terrainTypes = {
            'flat': { incline: 0, energyDrain: 1 },
            'hills': { incline: 2, energyDrain: 2 },
            'mountain': { incline: 3, energyDrain: 3 }
        };

        const segments = [];
        const segmentLength = this.levelData.distance / 10;
        
        for (let i = 0; i < 10; i++) {
            segments.push({
                ...terrainTypes[this.levelData.terrain],
                length: segmentLength,
                start: i * segmentLength
            });
        }
        
        return segments;
    }

    renderTerrain() {
        const path = document.querySelector('.terrain-path');
        let pathData = '';
        
        this.terrain.forEach((segment, index) => {
            const x1 = (index * 10);
            const x2 = ((index + 1) * 10);
            const y1 = 50 - (segment.incline * 5);
            const y2 = 50 - (segment.incline * 5);
            
            if (index === 0) {
                pathData += `M ${x1} ${50} `;
            }
            pathData += `L ${x1} ${y1} L ${x2} ${y2} `;
        });
        
        path.style.setProperty('--path-data', `"${pathData}"`);
        
        // Add terrain decorations
        this.terrain.forEach((segment, index) => {
            const decoration = document.createElement('div');
            decoration.className = 'terrain-decoration';
            decoration.style.left = `${index * 10}%`;
            
            if (this.levelData.terrain === 'mountain') {
                decoration.textContent = '🏔️';
            } else if (this.levelData.terrain === 'hills') {
                decoration.textContent = '⛰️';
            } else {
                decoration.textContent = '🌳';
            }
            
            this.terrainElements.appendChild(decoration);
        });
    }

    bindEvents() {
        this.handleKeyDown = (e) => {
            if (!this.isActive) return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.pedal();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.adjustBalance(-2);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.adjustBalance(2);
                    break;
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);
    }

    startCycling() {
        this.isActive = true;
        document.getElementById('start-btn').style.display = 'none';
        this.audioManager.play('NewLevel');
        this.startGameLoop();
    }

    startGameLoop() {
        let lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.isActive) return;
            
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;
            
            this.updateGame(deltaTime);
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }

    updateGame(deltaTime) {
        // Update speed based on energy and terrain
        const currentSegment = this.getCurrentTerrainSegment();
        const energyFactor = this.energy / 100;
        const terrainFactor = 1 - (currentSegment.incline * 0.1);
        
        this.speed = Math.max(0, this.speed * terrainFactor * energyFactor);
        
        // Update distance
        this.distance += this.speed * deltaTime;
        
        // Drain energy based on terrain
        this.energy = Math.max(0, this.energy - (currentSegment.energyDrain * deltaTime));
        
        // Apply balance effects
        if (Math.abs(this.balance - 50) > 40) {
            this.speed *= 0.95; // Slow down when unbalanced
        }
        
        // Update visuals
        this.updateUI();
        this.moveBackground();
        
        // Check win/lose conditions
        if (this.distance >= this.levelData.distance) {
            this.completeGame();
        } else if (this.energy <= 0) {
            this.endGame('exhausted');
        } else if (Math.abs(this.balance - 50) > 48) {
            this.endGame('fell');
        }
    }

    getCurrentTerrainSegment() {
        return this.terrain.find(segment => 
            this.distance >= segment.start && 
            this.distance < segment.start + segment.length
        ) || this.terrain[0];
    }

    pedal() {
        const now = performance.now();
        const interval = now - this.lastPedalTime;
        
        // Check pedal rhythm (ideal interval is 500ms)
        if (interval > 200) { // Prevent too rapid pedaling
            const rhythmQuality = this.calculateRhythmQuality(interval);
            
            if (rhythmQuality > 0.8) {
                this.perfectPedals++;
                document.getElementById('perfect-pedals').textContent = this.perfectPedals;
                this.showPedalFeedback('Perfect! 💫');
                this.audioManager.play('GoodResult');
                this.speed += 2;
            } else if (rhythmQuality > 0.5) {
                this.showPedalFeedback('Good! ⭐');
                this.audioManager.play('Success');
                this.speed += 1;
            } else {
                this.showPedalFeedback('Off rhythm! 😅');
                this.speed += 0.5;
            }
            
            this.energy = Math.min(100, this.energy + (rhythmQuality * 5));
            this.lastPedalTime = now;
            
            this.cyclist.classList.add('pedaling');
            setTimeout(() => this.cyclist.classList.remove('pedaling'), 150);
        }
    }

    calculateRhythmQuality(interval) {
        const idealInterval = 500;
        const difference = Math.abs(interval - idealInterval);
        return Math.max(0, 1 - (difference / idealInterval));
    }

    adjustBalance(amount) {
        this.balance = Math.max(0, Math.min(100, this.balance + amount));
        this.balanceMarker.style.left = `${this.balance}%`;
        
        // Visual feedback
        this.cyclist.style.transform = `rotate(${(this.balance - 50) / 2}deg)`;
    }

    showPedalFeedback(message) {
        const feedback = document.getElementById('pedal-feedback');
        feedback.textContent = message;
        feedback.classList.add('show');
        setTimeout(() => feedback.classList.remove('show'), 500);
    }

    moveBackground() {
        const progress = (this.distance / this.levelData.distance) * 100;
        document.querySelector('.terrain-background').style.backgroundPosition = 
            `${-progress * 2}% 0`;
    }

    updateUI() {
        document.getElementById('distance').textContent = Math.floor(this.distance);
        document.getElementById('speed').textContent = Math.floor(this.speed);
        this.energyBar.style.width = `${this.energy}%`;
    }

    completeGame() {
        this.isActive = false;
        
        const terrainBonus = this.levelData.terrain === 'mountain' ? 100 :
                            this.levelData.terrain === 'hills' ? 50 : 0;
        const energyBonus = Math.floor(this.energy);
        const rhythmBonus = this.perfectPedals * 10;
        const totalPoints = this.levelData.points + terrainBonus + energyBonus + rhythmBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Cycling Complete! 🎉",
            {
                "Distance": `${Math.floor(this.distance)}m`,
                "Perfect Pedals": this.perfectPedals,
                "Final Energy": `${Math.floor(this.energy)}%`
            },
            {
                "Base Points": this.levelData.points,
                "Terrain Bonus": terrainBonus,
                "Energy Bonus": energyBonus,
                "Rhythm Bonus": rhythmBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    endGame(reason) {
        this.isActive = false;
        let message = '';
        
        switch(reason) {
            case 'exhausted':
                message = 'Out of energy! Remember to maintain rhythm! 😓';
                break;
            case 'fell':
                message = 'Lost balance! Keep centered! 😅';
                break;
        }
        
        const dialog = gameUtils.UIUtils.createDialog(
            "Game Over",
            {
                "Distance": `${Math.floor(this.distance)}m`,
                "Reason": message,
                "Perfect Pedals": this.perfectPedals
            },
            null,
            true
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        super.cleanup();
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// Update PhysicalGameFactory
class PhysicalGameFactory {
    static createGame(gameId, level, gameManager) {
        switch(gameId) {
            case 'hoops':
                return new HoopsGame(level, gameManager);
            case 'runner':
                return new RunnerGame(level, gameManager);
            case 'squat':
                return new SquatGame(level, gameManager);
            case 'swim':
                return new SwimGame(level, gameManager);
            case 'cycle':
                return new CycleGame(level, gameManager);
            default:
                throw new Error(`Unknown game: ${gameId}`);
        }
    }
}

