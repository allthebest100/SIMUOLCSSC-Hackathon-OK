// Mental Game Base Class
class MentalGameBase {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isActive = false;
        this.audioManager = new gameUtils.AudioManager();
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        this.audioManager.play('NewLevel');
    }

    cleanup() {
        this.isActive = false;
        this.removeEvents();
    }
}

// Game Configurations
const MENTAL_GAMES = {
    colorMatch: {
        id: 'colorMatch',
        name: "Colour Match",
        icon: '🎨',
        description: "Match colors with focused precision",
        unlockLevel: 1,
        wellnessTip: "Calm Focus",
        levels: [
            { pairs: 4, time: 60, points: 100, name: "Basic Patterns" },
            { pairs: 6, time: 60, points: 200, name: "Complex Patterns" },
            { pairs: 8, time: 60, points: 300, name: "Expert Patterns" }
        ]
    },
    memoryTiles: {
        id: 'memoryTiles',
        name: "Memory Tiles",
        icon: '🧩',
        description: "Test and improve your memory",
        unlockLevel: 2,
        wellnessTip: "Sharpen Memory",
        levels: [
            { tiles: 12, time: 90, points: 150, name: "Simple Memory" },
            { tiles: 16, time: 120, points: 250, name: "Complex Memory" },
            { tiles: 20, time: 150, points: 350, name: "Expert Memory" }
        ]
    },
    puzzle2048: {
        id: 'puzzle2048',
        name: "2048",
        icon: '🔢',
        description: "Combine numbers strategically",
        unlockLevel: 3,
        wellnessTip: "Patience Wins",
        levels: [
            { target: 256, moves: 50, points: 200, name: "Basic Strategy" },
            { target: 512, moves: 100, points: 300, name: "Advanced Strategy" },
            { target: 1024, moves: 150, points: 400, name: "Expert Strategy" }
        ]
    },
    snake: {
        id: 'snake',
        name: "Snake",
        icon: '🐍',
        description: "Guide the snake with mindfulness",
        unlockLevel: 4,
        wellnessTip: "Mindful Moves",
        levels: [
            { target: 10, speed: 1, points: 250, name: "Slow & Steady" },
            { target: 15, speed: 1.5, points: 350, name: "Pick up Pace" },
            { target: 20, speed: 2, points: 450, name: "Swift & Mindful" }
        ]
    },
    whackaMole: {
        id: 'whackaMole',
        name: "Whack-a-Mole",
        icon: '🔨',
        description: "Release stress with quick reactions",
        unlockLevel: 5,
        wellnessTip: "Stress Release",
        levels: [
            { targets: 20, time: 30, points: 300, name: "Stress Relief" },
            { targets: 30, time: 30, points: 400, name: "Quick Relief" },
            { targets: 40, time: 30, points: 500, name: "Zen Master" }
        ]
    }
};

// Game Factory
class MentalGameFactory {
    static createGame(gameId, level, gameManager) {
        switch(gameId) {
            case 'colorMatch':
                return new ColorMatchGame(level, gameManager);
            case 'memoryTiles':
                return new MemoryTilesGame(level, gameManager);
            case 'puzzle2048':
                return new Puzzle2048Game(level, gameManager);
            case 'snake':
                return new SnakeGame(level, gameManager);
            case 'whackaMole':
                return new WhackaMoleGame(level, gameManager);
            default:
                throw new Error(`Unknown game: ${gameId}`);
        }
    }
}

// Export configurations and factory
window.MENTAL_GAMES = MENTAL_GAMES;
window.MentalGameFactory = MentalGameFactory;

// Color Match Game
class ColorMatchGame extends MentalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = MENTAL_GAMES.colorMatch.levels[level - 1];
        this.score = 0;
        this.timeLeft = this.levelData.time;
        this.patterns = [];
        this.currentPattern = null;
        this.selectedColors = [];
        this.matchesMade = 0;
        this.streakCount = 0;

        this.colors = [
            { name: 'red', code: '#FF5252', emoji: '❤️' },
            { name: 'blue', code: '#2196F3', emoji: '💙' },
            { name: 'green', code: '#4CAF50', emoji: '💚' },
            { name: 'yellow', code: '#FFC107', emoji: '💛' },
            { name: 'purple', code: '#9C27B0', emoji: '💜' },
            { name: 'orange', code: '#FF9800', emoji: '🧡' }
        ];
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="color-match-game">
                <div class="game-header">
                    <div class="game-stats">
                        <span class="time">⏰ <span id="time-left">${this.timeLeft}</span>s</span>
                        <span class="score">✨ <span id="current-score">${this.score}</span></span>
                        <span class="streak">🔥 x<span id="streak-count">0</span></span>
                    </div>
                </div>

                <div class="game-area">
                    <div class="pattern-display">
                        <div id="target-pattern" class="pattern"></div>
                        <div class="pattern-label">Match this pattern!</div>
                    </div>

                    <div class="color-grid" id="color-grid"></div>

                    <div class="selected-colors">
                        <div id="selected-pattern" class="pattern"></div>
                        <div class="pattern-label">Your selection</div>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Matching!</button>
                    <button id="clear-btn" class="game-button secondary hidden">Clear Selection</button>
                </div>

                <div id="feedback" class="feedback-message"></div>
            </div>
        `;

        this.setupGame();
    }

    setupGame() {
        this.generatePatterns();
        this.renderColorGrid();

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearSelection());
    }

    generatePatterns() {
        const patternLength = this.level + 2; // Increases with level
        for (let i = 0; i < this.levelData.pairs * 2; i++) {
            let pattern = [];
            for (let j = 0; j < patternLength; j++) {
                pattern.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
            }
            this.patterns.push(pattern);
        }
        this.patterns = gameUtils.MathUtils.shuffleArray(this.patterns);
    }

    renderColorGrid() {
        const grid = document.getElementById('color-grid');
        this.colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'color-button';
            colorBtn.style.backgroundColor = color.code;
            colorBtn.innerHTML = color.emoji;
            colorBtn.addEventListener('click', () => this.selectColor(color));
            grid.appendChild(colorBtn);
        });
    }

    startGame() {
        this.isActive = true;
        document.getElementById('start-btn').classList.add('hidden');
        document.getElementById('clear-btn').classList.remove('hidden');
        this.showNextPattern();
        this.startTimer();
        this.audioManager.play('NewLevel');
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    selectColor(color) {
        if (!this.isActive || this.selectedColors.length >= this.currentPattern.length) return;

        this.selectedColors.push(color);
        this.updateSelectedPattern();
        
        if (this.selectedColors.length === this.currentPattern.length) {
            this.checkMatch();
        }
    }

    updateSelectedPattern() {
        const pattern = document.getElementById('selected-pattern');
        pattern.innerHTML = this.selectedColors.map(color => `
            <div class="color-dot" style="background-color: ${color.code}">
                ${color.emoji}
            </div>
        `).join('');
    }

    showNextPattern() {
        this.currentPattern = this.patterns.pop();
        if (!this.currentPattern) {
            this.completeGame();
            return;
        }

        const pattern = document.getElementById('target-pattern');
        pattern.innerHTML = this.currentPattern.map(color => `
            <div class="color-dot" style="background-color: ${color.code}">
                ${color.emoji}
            </div>
        `).join('');
    }

    checkMatch() {
        let isMatch = true;
        for (let i = 0; i < this.currentPattern.length; i++) {
            if (this.selectedColors[i].name !== this.currentPattern[i].name) {
                isMatch = false;
                break;
            }
        }

        if (isMatch) {
            this.handleCorrectMatch();
        } else {
            this.handleIncorrectMatch();
        }

        setTimeout(() => {
            this.selectedColors = [];
            this.updateSelectedPattern();
            this.showNextPattern();
        }, 1000);
    }

    handleCorrectMatch() {
        this.streakCount++;
        this.matchesMade++;
        const streakBonus = Math.min(5, Math.floor(this.streakCount / 3));
        const points = 10 * (1 + streakBonus);
        this.score += points;

        document.getElementById('current-score').textContent = this.score;
        document.getElementById('streak-count').textContent = this.streakCount;
        
        this.showFeedback(`Perfect Match! +${points} points! 🎯`, 'success');
        this.audioManager.play('GoodResult');
    }

    handleIncorrectMatch() {
        this.streakCount = 0;
        document.getElementById('streak-count').textContent = this.streakCount;
        this.showFeedback('Wrong pattern! Try again! 😅', 'error');
        this.audioManager.play('Fail');
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
        feedback.classList.add('show');
        
        setTimeout(() => {
            feedback.classList.remove('show');
        }, 2000);
    }

    clearSelection() {
        this.selectedColors = [];
        this.updateSelectedPattern();
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.timer);

        const timeBonus = this.timeLeft * 2;
        const accuracyBonus = Math.floor((this.matchesMade / this.levelData.pairs) * 100);
        const totalPoints = this.score + timeBonus + accuracyBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Level Complete! 🎉",
            {
                "Matches Made": `${this.matchesMade}/${this.levelData.pairs}`,
                "Longest Streak": this.streakCount,
                "Time Remaining": `${this.timeLeft}s`
            },
            {
                "Pattern Points": this.score,
                "Time Bonus": timeBonus,
                "Accuracy Bonus": accuracyBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);

        const dialog = gameUtils.UIUtils.createDialog(
            "Time's Up!",
            {
                "Final Score": this.score,
                "Matches Made": `${this.matchesMade}/${this.levelData.pairs}`,
                "Best Streak": this.streakCount
            },
            null,
            true
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        super.cleanup();
        clearInterval(this.timer);
    }
}

// Memory Tiles Game
class MemoryTilesGame extends MentalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = MENTAL_GAMES.memoryTiles.levels[level - 1];
        this.tiles = [];
        this.flippedTiles = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timeLeft = this.levelData.time;
        this.canFlip = false;

        // Memory tile emojis
        this.tileEmojis = [
            '🌟', '🌈', '🌺', '🌸', '🍀', '🦋', 
            '🐬', '🦄', '🌙', '🌞', '🎨', '🎭',
            '🎪', '🎡', '🎮', '🎲', '🎯', '🎭'
        ];
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="memory-game">
                <div class="game-header">
                    <div class="game-stats">
                        <span>⏰ <span id="time-left">${this.timeLeft}</span>s</span>
                        <span>🔄 Moves: <span id="moves-count">0</span></span>
                        <span>✨ Pairs: <span id="pairs-count">0</span>/${this.levelData.tiles / 2}</span>
                    </div>
                </div>

                <div class="memory-board" id="memory-board"></div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Game</button>
                    <div class="instructions">
                        <p>Find matching pairs of tiles</p>
                        <p>Remember their positions!</p>
                    </div>
                </div>
            </div>
        `;

        this.setupGame();
    }

    setupGame() {
        this.createTiles();
        this.renderBoard();
        
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
    }

    createTiles() {
        // Select emojis for this level
        const levelEmojis = this.tileEmojis.slice(0, this.levelData.tiles / 2);
        
        // Create pairs
        this.tiles = [...levelEmojis, ...levelEmojis].map((emoji, index) => ({
            id: index,
            emoji: emoji,
            isFlipped: false,
            isMatched: false
        }));

        // Shuffle tiles
        this.tiles = gameUtils.MathUtils.shuffleArray(this.tiles);
    }

    renderBoard() {
        const board = document.getElementById('memory-board');
        board.innerHTML = '';
        
        // Calculate grid size
        const cols = Math.ceil(Math.sqrt(this.tiles.length));
        board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        this.tiles.forEach(tile => {
            const tileElement = document.createElement('div');
            tileElement.className = 'memory-tile';
            tileElement.dataset.id = tile.id;
            
            tileElement.innerHTML = `
                <div class="tile-inner">
                    <div class="tile-front">❓</div>
                    <div class="tile-back">${tile.emoji}</div>
                </div>
            `;

            tileElement.addEventListener('click', () => this.flipTile(tile.id));
            board.appendChild(tileElement);
        });
    }

    startGame() {
        this.isActive = true;
        this.canFlip = true;
        document.getElementById('start-btn').style.display = 'none';
        this.audioManager.play('NewLevel');
        this.startTimer();

        // Show all tiles briefly
        this.showAllTiles();
    }

    showAllTiles() {
        this.canFlip = false;
        const tiles = document.querySelectorAll('.memory-tile');
        tiles.forEach(tile => tile.classList.add('flipped'));

        setTimeout(() => {
            tiles.forEach(tile => tile.classList.remove('flipped'));
            this.canFlip = true;
        }, 2000);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame('timeout');
            }
        }, 1000);
    }

    flipTile(id) {
        if (!this.canFlip || !this.isActive) return;
        
        const tile = this.tiles[id];
        const tileElement = document.querySelector(`[data-id="${id}"]`);

        // Prevent flipping if tile is already flipped or matched
        if (tile.isFlipped || tile.isMatched) return;
        
        // Prevent flipping more than 2 tiles
        if (this.flippedTiles.length >= 2) return;

        // Flip the tile
        tile.isFlipped = true;
        tileElement.classList.add('flipped');
        this.flippedTiles.push({ tile, element: tileElement });

        this.audioManager.play('Success');

        if (this.flippedTiles.length === 2) {
            this.moves++;
            document.getElementById('moves-count').textContent = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        this.canFlip = false;
        const [first, second] = this.flippedTiles;

        if (first.tile.emoji === second.tile.emoji) {
            // Match found
            setTimeout(() => {
                first.element.classList.add('matched');
                second.element.classList.add('matched');
                first.tile.isMatched = second.tile.isMatched = true;
                this.matchedPairs++;
                document.getElementById('pairs-count').textContent = this.matchedPairs;
                
                this.audioManager.play('GoodResult');
                this.showFeedback('Match found! 🎉', 'success');

                this.flippedTiles = [];
                this.canFlip = true;

                if (this.matchedPairs === this.levelData.tiles / 2) {
                    this.completeGame();
                }
            }, 500);
        } else {
            // No match
            setTimeout(() => {
                first.element.classList.remove('flipped');
                second.element.classList.remove('flipped');
                first.tile.isFlipped = second.tile.isFlipped = false;
                this.flippedTiles = [];
                this.canFlip = true;
                
                this.audioManager.play('Fail');
                this.showFeedback('Try again! 🤔', 'error');
            }, 1000);
        }
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `memory-feedback ${type}`;
        feedback.textContent = message;
        
        document.querySelector('.memory-game').appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 1000);
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.timer);

        const timeBonus = this.timeLeft * 5;
        const movesBonus = Math.max(0, 100 - (this.moves - this.levelData.tiles) * 2);
        const totalPoints = this.levelData.points + timeBonus + movesBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Memory Master! 🎉",
            {
                "Pairs Found": `${this.matchedPairs}/${this.levelData.tiles / 2}`,
                "Moves Made": this.moves,
                "Time Left": `${this.timeLeft}s`
            },
            {
                "Base Points": this.levelData.points,
                "Time Bonus": timeBonus,
                "Efficiency Bonus": movesBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    endGame(reason) {
        this.isActive = false;
        clearInterval(this.timer);

        const dialog = gameUtils.UIUtils.createDialog(
            reason === 'timeout' ? "Time's Up!" : "Game Over",
            {
                "Pairs Found": `${this.matchedPairs}/${this.levelData.tiles / 2}`,
                "Moves Made": this.moves,
                "Final Score": this.calculateScore()
            },
            null,
            true
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    calculateScore() {
        return Math.floor(
            (this.matchedPairs / (this.levelData.tiles / 2)) * this.levelData.points
        );
    }

    cleanup() {
        super.cleanup();
        clearInterval(this.timer);
    }
}

// Update MentalGameFactory
MentalGameFactory.createGame = function(gameId, level, gameManager) {
    switch(gameId) {
        case 'colorMatch':
            return new ColorMatchGame(level, gameManager);
        case 'memoryTiles':
            return new MemoryTilesGame(level, gameManager);
        // Other games will be added here
        default:
            throw new Error(`Unknown game: ${gameId}`);
    }
};

// 2048 Game
class Puzzle2048Game extends MentalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = MENTAL_GAMES.puzzle2048.levels[level - 1];
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.moves = 0;
        this.maxMoves = this.levelData.moves;
        this.highestTile = 0;
        this.canMove = false;
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="puzzle-2048">
                <div class="game-header">
                    <div class="game-stats">
                        <span>🎯 Target: ${this.levelData.target}</span>
                        <span>🔄 Moves: <span id="moves-left">${this.maxMoves}</span></span>
                        <span>✨ Score: <span id="current-score">0</span></span>
                    </div>
                </div>

                <div class="game-board">
                    <div class="grid-container">
                        ${this.createGrid()}
                    </div>
                </div>

                <div class="game-controls">
                    <div class="arrow-controls">
                        <button class="control-btn up" data-direction="up">⬆️</button>
                        <div class="horizontal-controls">
                            <button class="control-btn left" data-direction="left">⬅️</button>
                            <button class="control-btn right" data-direction="right">➡️</button>
                        </div>
                        <button class="control-btn down" data-direction="down">⬇️</button>
                    </div>
                    <button id="start-btn" class="game-button">Start Game</button>
                </div>

                <div class="instructions">
                    <p>Use arrow keys or buttons to move tiles</p>
                    <p>Combine matching numbers to reach ${this.levelData.target}!</p>
                </div>
            </div>
        `;

        this.setupGame();
    }

    createGrid() {
        return Array(4).fill().map((_, row) => `
            <div class="grid-row">
                ${Array(4).fill().map((_, col) => `
                    <div class="grid-cell" data-row="${row}" data-col="${col}">
                        <div class="tile"></div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    setupGame() {
        this.bindEvents();
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    }

    bindEvents() {
        // Keyboard controls
        this.handleKeyDown = (e) => {
            if (!this.canMove) return;

            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);

        // Touch controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.canMove) {
                    this.move(btn.dataset.direction);
                }
            });
        });
    }

    startGame() {
        this.canMove = true;
        document.getElementById('start-btn').style.display = 'none';
        this.audioManager.play('NewLevel');
        this.addNewTile();
        this.addNewTile();
        this.updateGrid();
    }

    addNewTile() {
        const emptyCells = [];
        this.grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 0) emptyCells.push([i, j]);
            });
        });

        if (emptyCells.length) {
            const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    move(direction) {
        const oldGrid = JSON.stringify(this.grid);
        let moved = false;

        switch(direction) {
            case 'up':
                moved = this.moveVertical(-1);
                break;
            case 'down':
                moved = this.moveVertical(1);
                break;
            case 'left':
                moved = this.moveHorizontal(-1);
                break;
            case 'right':
                moved = this.moveHorizontal(1);
                break;
        }

        if (moved) {
            this.moves++;
            this.maxMoves--;
            document.getElementById('moves-left').textContent = this.maxMoves;
            this.addNewTile();
            this.updateGrid();
            this.audioManager.play('Success');

            if (this.maxMoves <= 0) {
                this.endGame('moves');
            } else if (this.hasWon()) {
                this.completeGame();
            } else if (!this.canMakeMove()) {
                this.endGame('blocked');
            }
        }
    }

    moveHorizontal(direction) {
        let moved = false;
        for (let row = 0; row < 4; row++) {
            const line = this.grid[row].filter(cell => cell !== 0);
            const merged = [];
            
            if (direction === 1) line.reverse();

            for (let i = 0; i < line.length - 1; i++) {
                if (line[i] === line[i + 1] && !merged.includes(i)) {
                    line[i] *= 2;
                    this.updateScore(line[i]);
                    line.splice(i + 1, 1);
                    merged.push(i);
                    moved = true;
                }
            }

            if (direction === 1) line.reverse();

            const newLine = Array(4).fill(0);
            line.forEach((value, index) => {
                newLine[direction === 1 ? 3 - index : index] = value;
            });

            if (JSON.stringify(this.grid[row]) !== JSON.stringify(newLine)) {
                moved = true;
            }
            this.grid[row] = newLine;
        }
        return moved;
    }

    moveVertical(direction) {
        let moved = false;
        for (let col = 0; col < 4; col++) {
            let line = this.grid.map(row => row[col]).filter(cell => cell !== 0);
            const merged = [];
            
            if (direction === 1) line.reverse();

            for (let i = 0; i < line.length - 1; i++) {
                if (line[i] === line[i + 1] && !merged.includes(i)) {
                    line[i] *= 2;
                    this.updateScore(line[i]);
                    line.splice(i + 1, 1);
                    merged.push(i);
                    moved = true;
                }
            }

            if (direction === 1) line.reverse();

            const newLine = Array(4).fill(0);
            line.forEach((value, index) => {
                newLine[direction === 1 ? 3 - index : index] = value;
            });

            let changed = false;
            for (let row = 0; row < 4; row++) {
                if (this.grid[row][col] !== newLine[row]) {
                    changed = true;
                }
                this.grid[row][col] = newLine[row];
            }
            if (changed) moved = true;
        }
        return moved;
    }

    updateScore(value) {
        this.score += value;
        this.highestTile = Math.max(this.highestTile, value);
        document.getElementById('current-score').textContent = this.score;
    }

    updateGrid() {
        this.grid.forEach((row, i) => {
            row.forEach((value, j) => {
                const tile = document.querySelector(
                    `.grid-cell[data-row="${i}"][data-col="${j}"] .tile`
                );
                
                tile.className = `tile${value ? ' tile-' + value : ''}`;
                tile.textContent = value || '';

                if (value > 0) {
                    tile.style.transform = 'scale(1)';
                } else {
                    tile.style.transform = 'scale(0)';
                }
            });
        });
    }

    hasWon() {
        return this.highestTile >= this.levelData.target;
    }

    canMakeMove() {
        // Check for empty cells
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (this.grid[row][col] === 0) return true;
            }
        }

        // Check for possible merges
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const current = this.grid[row][col];
                // Check right
                if (col < 3 && current === this.grid[row][col + 1]) return true;
                // Check down
                if (row < 3 && current === this.grid[row + 1][col]) return true;
            }
        }

        return false;
    }

    completeGame() {
        this.canMove = false;
        const moveBonus = Math.max(0, (this.levelData.moves - this.moves) * 10);
        const scoreBonus = Math.floor(this.score / 100);
        const totalPoints = this.levelData.points + moveBonus + scoreBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Puzzle Complete! 🎉",
            {
                "Highest Tile": this.highestTile,
                "Moves Used": this.moves,
                "Final Score": this.score
            },
            {
                "Base Points": this.levelData.points,
                "Move Bonus": moveBonus,
                "Score Bonus": scoreBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    endGame(reason) {
        this.canMove = false;
        const dialog = gameUtils.UIUtils.createDialog(
            reason === 'moves' ? "Out of Moves!" : "No Moves Possible!",
            {
                "Highest Tile": this.highestTile,
                "Moves Used": this.moves,
                "Final Score": this.score
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

// Update MentalGameFactory
MentalGameFactory.createGame = function(gameId, level, gameManager) {
    switch(gameId) {
        case 'colorMatch':
            return new ColorMatchGame(level, gameManager);
        case 'memoryTiles':
            return new MemoryTilesGame(level, gameManager);
        case 'puzzle2048':
            return new Puzzle2048Game(level, gameManager);
        // Other games will be added here
        default:
            throw new Error(`Unknown game: ${gameId}`);
    }
};

// Snake Game
class SnakeGame extends MentalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = MENTAL_GAMES.snake.levels[level - 1];
        this.gridSize = 20;
        this.snake = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.food = null;
        this.score = 0;
        this.speed = 200 - (this.levelData.speed * 50);
        this.gameLoop = null;
        this.isPaused = false;
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="snake-game">
                <div class="game-header">
                    <div class="game-stats">
                        <span>🎯 Target: ${this.levelData.target}</span>
                        <span>🐍 Length: <span id="snake-length">0</span></span>
                        <span>✨ Score: <span id="current-score">0</span></span>
                    </div>
                </div>

                <div class="game-area">
                    <canvas id="snake-canvas"></canvas>
                    <div id="mindful-tip" class="mindful-tip"></div>
                </div>

                <div class="game-controls">
                    <div class="control-buttons">
                        <button class="control-btn" data-direction="up">⬆️</button>
                        <div class="horizontal-controls">
                            <button class="control-btn" data-direction="left">⬅️</button>
                            <button class="control-btn pause-btn">⏸️</button>
                            <button class="control-btn" data-direction="right">➡️</button>
                        </div>
                        <button class="control-btn" data-direction="down">⬇️</button>
                    </div>
                    <button id="start-btn" class="game-button">Start Game</button>
                </div>

                <div class="instructions">
                    <p>Use arrow keys or buttons to guide the snake</p>
                    <p>Practice mindful movement</p>
                </div>
            </div>
        `;

        this.setupGame();
    }

    setupGame() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.cellSize = Math.floor(Math.min(400, window.innerWidth - 40) / this.gridSize);
        this.canvas.width = this.cellSize * this.gridSize;
        this.canvas.height = this.cellSize * this.gridSize;

        // Initialize snake
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];

        this.bindEvents();
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    }

    bindEvents() {
        this.handleKeyDown = (e) => {
            if (!this.isActive) return;

            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    break;
                case ' ':
                    this.togglePause();
                    break;
            }
        };

        document.addEventListener('keydown', this.handleKeyDown);

        // Touch controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                if (!direction) {
                    if (btn.classList.contains('pause-btn')) this.togglePause();
                    return;
                }

                const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
                if (this.direction !== opposites[direction]) {
                    this.nextDirection = direction;
                }
            });
        });
    }

    startGame() {
        this.isActive = true;
        document.getElementById('start-btn').style.display = 'none';
        this.audioManager.play('NewLevel');
        this.spawnFood();
        this.gameLoop = setInterval(() => this.update(), this.speed);
        this.showMindfulTip();
    }

    update() {
        if (this.isPaused) return;

        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check collision with walls
        if (head.x < 0 || head.x >= this.gridSize || 
            head.y < 0 || head.y >= this.gridSize) {
            this.endGame('wall');
            return;
        }

        // Check collision with self
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame('self');
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.handleFoodCollision();
        } else {
            this.snake.pop();
        }

        this.draw();
        this.updateStats();
    }

    handleFoodCollision() {
        this.score += 10;
        this.audioManager.play('GoodResult');
        this.spawnFood();
        this.showMindfulTip();

        if (this.snake.length >= this.levelData.target) {
            this.completeGame();
        }
    }

    spawnFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.snake.some(segment => 
            segment.x === this.food.x && segment.y === this.food.y
        ));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#81C784';
            this.ctx.fillRect(
                segment.x * this.cellSize,
                segment.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        });

        // Draw food
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.cellSize,
            (this.food.y + 0.5) * this.cellSize,
            this.cellSize / 2 - 1,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    updateStats() {
        document.getElementById('snake-length').textContent = this.snake.length;
        document.getElementById('current-score').textContent = this.score;
    }

    showMindfulTip() {
        const tips = [
            "Breathe deeply and stay focused",
            "Move with intention",
            "Stay present in the moment",
            "Notice your reactions",
            "Practice patience"
        ];

        const tip = document.getElementById('mindful-tip');
        tip.textContent = tips[Math.floor(Math.random() * tips.length)];
        tip.classList.add('show');
        setTimeout(() => tip.classList.remove('show'), 2000);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.querySelector('.pause-btn').textContent = this.isPaused ? '▶️' : '⏸️';
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.gameLoop);

        const speedBonus = Math.floor(this.levelData.speed * 20);
        const lengthBonus = (this.snake.length - this.levelData.target) * 5;
        const totalPoints = this.levelData.points + speedBonus + lengthBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Snake Master! 🎉",
            {
                "Final Length": this.snake.length,
                "Target Length": this.levelData.target,
                "Score": this.score
            },
            {
                "Base Points": this.levelData.points,
                "Speed Bonus": speedBonus,
                "Extra Length Bonus": lengthBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    endGame(reason) {
        this.isActive = false;
        clearInterval(this.gameLoop);

        const messages = {
            wall: "Hit the wall! Stay within bounds!",
            self: "Self collision! Mind your path!"
        };

        const dialog = gameUtils.UIUtils.createDialog(
            "Game Over!",
            {
                "Final Length": this.snake.length,
                "Reason": messages[reason],
                "Score": this.score
            },
            null,
            true
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        super.cleanup();
        clearInterval(this.gameLoop);
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

// Update MentalGameFactory
MentalGameFactory.createGame = function(gameId, level, gameManager) {
    switch(gameId) {
        case 'colorMatch':
            return new ColorMatchGame(level, gameManager);
        case 'memoryTiles':
            return new MemoryTilesGame(level, gameManager);
        case 'puzzle2048':
            return new Puzzle2048Game(level, gameManager);
        case 'snake':
            return new SnakeGame(level, gameManager);
        // Whack-a-Mole will be added next
        default:
            throw new Error(`Unknown game: ${gameId}`);
    }
};

// Whack-a-Mole Game
class WhackaMoleGame extends MentalGameBase {
    constructor(level, gameManager) {
        super(gameManager);
        this.level = level;
        this.levelData = MENTAL_GAMES.whackaMole.levels[level - 1];
        this.score = 0;
        this.timeLeft = this.levelData.time;
        this.hits = 0;
        this.targetHits = this.levelData.targets;
        this.currentMole = null;
        this.moleTimer = null;
        this.perfectHits = 0;
        this.grid = 3; // 3x3 grid
        this.moleSpeed = 1000 - (this.level * 150); // Gets faster with level
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="whack-a-mole">
                <div class="game-header">
                    <div class="game-stats">
                        <span>⏰ <span id="time-left">${this.timeLeft}</span>s</span>
                        <span>🎯 Hits: <span id="hits-count">${this.hits}</span>/${this.targetHits}</span>
                        <span>✨ Score: <span id="current-score">${this.score}</span></span>
                    </div>
                </div>

                <div class="game-area">
                    <div class="mole-grid">
                        ${this.createGrid()}
                    </div>
                    <div class="stress-meter">
                        <div class="meter-label">Stress Level</div>
                        <div class="meter-bar">
                            <div id="stress-bar" class="meter-fill" style="width: 100%"></div>
                        </div>
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Whacking!</button>
                    <div class="instructions">
                        <p>Click or tap the moles when they appear</p>
                        <p>Release stress with every hit!</p>
                    </div>
                </div>

                <div id="feedback" class="feedback-message"></div>
            </div>
        `;

        this.setupGame();
    }

    createGrid() {
        let grid = '';
        for (let i = 0; i < this.grid; i++) {
            grid += `<div class="mole-row">`;
            for (let j = 0; j < this.grid; j++) {
                grid += `
                    <div class="mole-hole" data-index="${i * this.grid + j}">
                        <div class="mole-dirt"></div>
                        <div class="mole" data-index="${i * this.grid + j}">
                            <div class="mole-face">😊</div>
                        </div>
                    </div>
                `;
            }
            grid += `</div>`;
        }
        return grid;
    }

    setupGame() {
        this.moles = Array.from(document.querySelectorAll('.mole'));
        this.holes = Array.from(document.querySelectorAll('.mole-hole'));
        
        this.moles.forEach(mole => {
            mole.addEventListener('click', () => this.whack(mole));
            mole.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.whack(mole);
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.isActive = true;
        document.getElementById('start-btn').style.display = 'none';
        this.audioManager.play('NewLevel');
        this.startTimer();
        this.showMole();
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').textContent = this.timeLeft;

            // Update stress meter
            const stressLevel = (this.timeLeft / this.levelData.time) * 100;
            document.getElementById('stress-bar').style.width = `${stressLevel}%`;
            
            if (this.timeLeft <= 0) {
                this.endGame('timeout');
            }
        }, 1000);
    }

    showMole() {
        if (!this.isActive) return;

        // Hide previous mole if exists
        if (this.currentMole !== null) {
            this.moles[this.currentMole].classList.remove('up');
        }

        // Select new hole
        let newHole;
        do {
            newHole = Math.floor(Math.random() * this.moles.length);
        } while (newHole === this.currentMole);

        this.currentMole = newHole;
        const mole = this.moles[this.currentMole];
        mole.classList.add('up');
        mole.dataset.startTime = Date.now();

        // Update mole expression
        this.updateMoleExpression(mole, '😊');

        // Set disappear timer
        this.moleTimer = setTimeout(() => {
            if (this.isActive) {
                mole.classList.remove('up');
                this.updateMoleExpression(mole, '😴');
                this.showMole();
            }
        }, this.moleSpeed);
    }

    whack(mole) {
        if (!this.isActive || !mole.classList.contains('up')) return;

        const index = parseInt(mole.dataset.index);
        if (index !== this.currentMole) return;

        // Calculate reaction time and accuracy
        const reactionTime = Date.now() - parseInt(mole.dataset.startTime);
        const accuracy = Math.max(0, 1 - (reactionTime / 1000));

        // Update score based on reaction time
        const points = Math.floor(accuracy * 100);
        this.score += points;
        this.hits++;

        // Visual feedback
        if (accuracy > 0.8) {
            this.perfectHits++;
            this.updateMoleExpression(mole, '🤩');
            this.showFeedback('Perfect hit! +' + points + ' points! 🎯', 'perfect');
            this.audioManager.play('GoodResult');
        } else if (accuracy > 0.5) {
            this.updateMoleExpression(mole, '😵');
            this.showFeedback('Good hit! +' + points + ' points! ✨', 'good');
            this.audioManager.play('Success');
        } else {
            this.updateMoleExpression(mole, '😫');
            this.showFeedback('Hit! +' + points + ' points!', 'normal');
            this.audioManager.play('Success');
        }

        // Update UI
        document.getElementById('hits-count').textContent = this.hits;
        document.getElementById('current-score').textContent = this.score;

        // Hide mole and show next
        clearTimeout(this.moleTimer);
        mole.classList.remove('up');
        
        // Check win condition
        if (this.hits >= this.targetHits) {
            this.completeGame();
        } else {
            setTimeout(() => this.showMole(), 500);
        }
    }

    updateMoleExpression(mole, expression) {
        const face = mole.querySelector('.mole-face');
        face.textContent = expression;
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback-message ${type}`;
        feedback.classList.add('show');
        
        setTimeout(() => feedback.classList.remove('show'), 1000);
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.gameTimer);
        clearTimeout(this.moleTimer);

        const timeBonus = this.timeLeft * 10;
        const accuracyBonus = Math.floor((this.perfectHits / this.hits) * 200);
        const totalPoints = this.score + timeBonus + accuracyBonus;

        const dialog = gameUtils.UIUtils.createDialog(
            "Stress Released! 🎉",
            {
                "Hits": `${this.hits}/${this.targetHits}`,
                "Perfect Hits": this.perfectHits,
                "Time Left": `${this.timeLeft}s`
            },
            {
                "Score": this.score,
                "Time Bonus": timeBonus,
                "Accuracy Bonus": accuracyBonus
            }
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    endGame(reason) {
        this.isActive = false;
        clearInterval(this.gameTimer);
        clearTimeout(this.moleTimer);

        const dialog = gameUtils.UIUtils.createDialog(
            "Time's Up!",
            {
                "Final Score": this.score,
                "Hits": `${this.hits}/${this.targetHits}`,
                "Perfect Hits": this.perfectHits
            },
            null,
            true
        );

        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        super.cleanup();
        clearInterval(this.gameTimer);
        clearTimeout(this.moleTimer);
    }
}

// Final update to MentalGameFactory
MentalGameFactory.createGame = function(gameId, level, gameManager) {
    switch(gameId) {
        case 'colorMatch':
            return new ColorMatchGame(level, gameManager);
        case 'memoryTiles':
            return new MemoryTilesGame(level, gameManager);
        case 'puzzle2048':
            return new Puzzle2048Game(level, gameManager);
        case 'snake':
            return new SnakeGame(level, gameManager);
        case 'whackaMole':
            return new WhackaMoleGame(level, gameManager);
        default:
            throw new Error(`Unknown game: ${gameId}`);
    }
};

