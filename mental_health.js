// Mental Health Games Configuration
const mentalGames = {
    puzzle2048: {
        id: 'puzzle2048',
        name: "2048 Challenge",
        icon: '🎮',
        description: "Train your strategic thinking",
        unlockLevel: 1,
        levels: [
            { target: 256, moves: 50, points: 100, name: "Beginner 2048" },
            { target: 512, moves: 100, points: 200, name: "Intermediate 2048" },
            { target: 2048, moves: 200, points: 300, name: "Master 2048" }
        ]
    },
    colorMatch: {
        id: 'colorMatch',
        name: "Color Match",
        icon: '🎨',
        description: "Test your pattern recognition",
        unlockLevel: 2,
        levels: [
            { colors: 4, time: 60, points: 150, name: "Simple Patterns" },
            { colors: 6, time: 45, points: 250, name: "Complex Patterns" },
            { colors: 8, time: 30, points: 350, name: "Expert Patterns" }
        ]
    },
    memoryTiles: {
        id: 'memoryTiles',
        name: "Memory Tiles",
        icon: '🧩',
        description: "Enhance your memory skills",
        unlockLevel: 3,
        levels: [
            { pairs: 6, time: 120, points: 200, name: "Memory Basics" },
            { pairs: 8, time: 100, points: 300, name: "Memory Challenge" },
            { pairs: 12, time: 90, points: 400, name: "Memory Master" }
        ]
    }
};

// 2048 Game Class
class Game2048 {
    constructor(level) {
        this.level = level;
        this.levelData = mentalGames.puzzle2048.levels[level - 1];
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.moves = 0;
        this.isActive = false;
        this.highestTile = 0;
    }

    initialize() {
        this.addNewTile();
        this.addNewTile();
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="game-2048">
                <div class="game-header">
                    <div class="game-info">
                        <div class="score">Score: <span id="current-score">0</span></div>
                        <div class="moves">Moves: <span id="moves-left">${this.levelData.moves}</span></div>
                        <div class="target">Target: ${this.levelData.target}</div>
                    </div>
                </div>
                <div class="game-grid" id="game-grid">
                    ${this.createGridHTML()}
                </div>
                <div class="game-controls">
                    <p>Use arrow keys to move tiles</p>
                    <button id="restart-btn" class="secondary-btn">Restart</button>
                </div>
            </div>
        `;

        this.updateGrid();
    }

    createGridHTML() {
        return Array(4).fill().map(() => 
            `<div class="grid-row">
                ${Array(4).fill('<div class="grid-cell"></div>').join('')}
            </div>`
        ).join('');
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    handleKeyPress(event) {
        if (!this.isActive) return;

        let moved = false;
        switch(event.key) {
            case 'ArrowUp':
                moved = this.move('up');
                break;
            case 'ArrowDown':
                moved = this.move('down');
                break;
            case 'ArrowLeft':
                moved = this.move('left');
                break;
            case 'ArrowRight':
                moved = this.move('right');
                break;
            default:
                return;
        }

        if (moved) {
            this.moves++;
            this.addNewTile();
            this.updateGrid();
            this.checkGameStatus();
        }
    }

    move(direction) {
        let moved = false;
        const newGrid = JSON.parse(JSON.stringify(this.grid));

        switch(direction) {
            case 'up':
                moved = this.moveVertical(newGrid, true);
                break;
            case 'down':
                moved = this.moveVertical(newGrid, false);
                break;
            case 'left':
                moved = this.moveHorizontal(newGrid, true);
                break;
            case 'right':
                moved = this.moveHorizontal(newGrid, false);
                break;
        }

        if (moved) {
            this.grid = newGrid;
            return true;
        }
        return false;
    }

    moveHorizontal(grid, left) {
        let moved = false;
        for (let i = 0; i < 4; i++) {
            const row = grid[i].filter(cell => cell !== 0);
            const merged = [];
            
            if (left) {
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1] && !merged.includes(j)) {
                        row[j] *= 2;
                        row.splice(j + 1, 1);
                        merged.push(j);
                        this.score += row[j];
                        this.highestTile = Math.max(this.highestTile, row[j]);
                        moved = true;
                    }
                }
                while (row.length < 4) row.push(0);
            } else {
                for (let j = row.length - 1; j > 0; j--) {
                    if (row[j] === row[j - 1] && !merged.includes(j)) {
                        row[j] *= 2;
                        row.splice(j - 1, 1);
                        merged.push(j);
                        this.score += row[j];
                        this.highestTile = Math.max(this.highestTile, row[j]);
                        moved = true;
                    }
                }
                while (row.length < 4) row.unshift(0);
            }
            
            if (JSON.stringify(grid[i]) !== JSON.stringify(row)) {
                moved = true;
                grid[i] = row;
            }
        }
        return moved;
    }

    moveVertical(grid, up) {
        let moved = false;
        for (let j = 0; j < 4; j++) {
            let column = grid.map(row => row[j]).filter(cell => cell !== 0);
            const merged = [];
            
            if (up) {
                for (let i = 0; i < column.length - 1; i++) {
                    if (column[i] === column[i + 1] && !merged.includes(i)) {
                        column[i] *= 2;
                        column.splice(i + 1, 1);
                        merged.push(i);
                        this.score += column[i];
                        this.highestTile = Math.max(this.highestTile, column[i]);
                        moved = true;
                    }
                }
                while (column.length < 4) column.push(0);
            } else {
                for (let i = column.length - 1; i > 0; i--) {
                    if (column[i] === column[i - 1] && !merged.includes(i)) {
                        column[i] *= 2;
                        column.splice(i - 1, 1);
                        merged.push(i);
                        this.score += column[i];
                        this.highestTile = Math.max(this.highestTile, column[i]);
                        moved = true;
                    }
                }
                while (column.length < 4) column.unshift(0);
            }
            
            if (moved) {
                for (let i = 0; i < 4; i++) {
                    grid[i][j] = column[i];
                }
            }
        }
        return moved;
    }

    addNewTile() {
        const emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({i, j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[i][j] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    updateGrid() {
        const gridElement = document.getElementById('game-grid');
        gridElement.innerHTML = this.grid.map(row => 
            `<div class="grid-row">
                ${row.map(cell => 
                    `<div class="grid-cell tile-${cell}">${cell || ''}</div>`
                ).join('')}
            </div>`
        ).join('');

        document.getElementById('current-score').textContent = this.score;
        document.getElementById('moves-left').textContent = 
            this.levelData.moves - this.moves;
    }

    checkGameStatus() {
        if (this.highestTile >= this.levelData.target) {
            this.completeGame();
            return;
        }

        if (this.moves >= this.levelData.moves) {
            this.failGame();
            return;
        }

        if (!this.hasValidMoves()) {
            this.failGame();
        }
    }

    hasValidMoves() {
        // Check for empty cells
        if (this.grid.some(row => row.some(cell => cell === 0))) {
            return true;
        }

        // Check for possible merges
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i][j];
                // Check right
                if (j < 3 && current === this.grid[i][j + 1]) return true;
                // Check down
                if (i < 3 && current === this.grid[i + 1][j]) return true;
            }
        }
        return false;
    }

    completeGame() {
        this.isActive = false;
        const moveBonus = Math.max(0, this.levelData.moves - this.moves);
        const totalPoints = this.levelData.points + moveBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, moveBonus);
    }

    failGame() {
        this.isActive = false;
        playSound('fail');
        this.showFailureDialog();
    }

    showCompletionDialog(totalPoints, moveBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Level Complete! 🎉</h2>
                <div class="stats-summary">
                    <div class="stat">Highest Tile: ${this.highestTile}</div>
                    <div class="stat">Moves Used: ${this.moves}</div>
                    <div class="stat">Score: ${this.score}</div>
                </div>
                <div class="points-breakdown">
                    <div class="point-item">Base Points: ${this.levelData.points}</div>
                    <div class="point-item">Move Bonus: +${moveBonus}</div>
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
                <h2>Game Over!</h2>
                <div class="stats-summary">
                    <div class="stat">Highest Tile: ${this.highestTile}</div>
                    <div class="stat">Target: ${this.levelData.target}</div>
                    <div class="stat">Score: ${this.score}</div>
                </div>
                <div class="action-buttons">
                    <button onclick="gameManager.retryGame()" class="primary-btn">Try Again</button>
                    <button onclick="gameManager.exitGame()" class="secondary-btn">Exit</button>
                </div>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    restart() {
        this.grid = Array(4).fill().map(() => Array(4).fill(0));
        this.score = 0;
        this.moves = 0;
        this.highestTile = 0;
        this.isActive = true;
        this.initialize();
    }

    cleanup() {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
}

// ColorMatch Game Class
class ColorMatch {
    constructor(level) {
        this.level = level;
        this.levelData = mentalGames.colorMatch.levels[level - 1];
        this.colors = [
            '#FF5252', '#4CAF50', '#2196F3', '#FFC107',
            '#9C27B0', '#FF9800', '#00BCD4', '#795548'
        ].slice(0, this.levelData.colors);
        this.sequence = [];
        this.playerSequence = [];
        this.isActive = false;
        this.score = 0;
    }

    initialize() {
        this.remainingTime = this.levelData.time;
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="color-match-game">
                <div class="game-header">
                    <div class="time-display">Time: <span id="time-left">${this.remainingTime}</span>s</div>
                    <div class="score-display">Score: <span id="current-score">${this.score}</span></div>
                </div>
                
                <div class="pattern-display" id="pattern-display"></div>
                
                <div class="color-buttons" id="color-buttons">
                    ${this.colors.map((color, index) => `
                        <button class="color-btn" style="background-color: ${color}"
                            data-color="${index}"></button>
                    `).join('')}
                </div>

                <div class="game-controls">
                    <button id="start-btn" class="primary-btn">Start Round</button>
                </div>
            </div>
        `;

        document.getElementById('start-btn').addEventListener('click', () => this.startRound());
    }

    bindEvents() {
        document.getElementById('color-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('color-btn')) {
                const colorIndex = parseInt(e.target.dataset.color);
                this.handleColorClick(colorIndex);
            }
        });
    }

    startRound() {
        this.isActive = true;
        this.generateSequence();
        this.showSequence();
        document.getElementById('start-btn').style.display = 'none';
        
        // Start timer
        this.timer = setInterval(() => {
            this.remainingTime--;
            document.getElementById('time-left').textContent = this.remainingTime;
            
            if (this.remainingTime <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    generateSequence() {
        const length = Math.min(5 + Math.floor(this.score / 50), 10);
        this.sequence = Array(length).fill(0)
            .map(() => Math.floor(Math.random() * this.colors.length));
    }

    showSequence() {
        const display = document.getElementById('pattern-display');
        let i = 0;
        
        const showNext = () => {
            if (i < this.sequence.length) {
                display.style.backgroundColor = this.colors[this.sequence[i]];
                setTimeout(() => {
                    display.style.backgroundColor = '#fff';
                    setTimeout(showNext, 300);
                }, 700);
                i++;
            } else {
                this.playerSequence = [];
                display.style.backgroundColor = '#fff';
            }
        };
        
        showNext();
    }

    handleColorClick(colorIndex) {
        if (!this.isActive) return;

        const expectedColor = this.sequence[this.playerSequence.length];
        this.playerSequence.push(colorIndex);

        if (colorIndex !== expectedColor) {
            this.failRound();
            return;
        }

        if (this.playerSequence.length === this.sequence.length) {
            this.completeRound();
        }
    }

    completeRound() {
        this.score += this.sequence.length * 10;
        document.getElementById('current-score').textContent = this.score;
        playSound('goodResult');
        
        setTimeout(() => {
            this.startRound();
        }, 1000);
    }

    failRound() {
        playSound('fail');
        const display = document.getElementById('pattern-display');
        display.style.backgroundColor = '#FF0000';
        
        setTimeout(() => {
            display.style.backgroundColor = '#fff';
            this.startRound();
        }, 1000);
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        const totalPoints = this.score + Math.floor(this.remainingTime * 2);
        if (this.score >= this.levelData.points) {
            this.showCompletionDialog(totalPoints);
        } else {
            this.showFailureDialog();
        }
    }

    showCompletionDialog(totalPoints) {
        playSound('success');
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Level Complete! 🎉</h2>
                <div class="stats-summary">
                    <div class="stat">Score: ${this.score}</div>
                    <div class="stat">Time Bonus: ${Math.floor(this.remainingTime * 2)}</div>
                </div>
                <div class="total-points">Total Points: ${totalPoints}</div>
                <button onclick="gameManager.completeGame(${totalPoints})" class="primary-btn">Continue</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    showFailureDialog() {
        playSound('fail');
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog failure';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Time's Up!</h2>
                <div class="stats-summary">
                    <div class="stat">Final Score: ${this.score}</div>
                    <div class="stat">Target Score: ${this.levelData.points}</div>
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
    }
}

// Memory Tiles Game Class
class MemoryTiles {
    constructor(level) {
        this.level = level;
        this.levelData = mentalGames.memoryTiles.levels[level - 1];
        this.tiles = [];
        this.flippedTiles = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isActive = false;
        this.remainingTime = this.levelData.time;
    }

    initialize() {
        this.createTiles();
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    createTiles() {
        const emojis = ['🎨', '🎮', '🎲', '🎯', '🎪', '🎭', '🎨', '🎪', '🎭', '🎲', '🎯', '🎮'];
        this.tiles = Array(this.levelData.pairs * 2).fill(null)
            .map((_, index) => ({
                id: index,
                emoji: emojis[Math.floor(index / 2)],
                isFlipped: false,
                isMatched: false
            }));
        
        // Shuffle tiles
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    renderUI() {
        const container = document.getElementById('game-container');
        container.innerHTML = `
            <div class="memory-game">
                <div class="game-header">
                    <div class="time-display">Time: <span id="time-left">${this.remainingTime}</span>s</div>
                    <div class="moves-display">Moves: <span id="moves-count">0</span></div>
                    <div class="pairs-display">Pairs: <span id="pairs-count">0</span>/${this.levelData.pairs}</div>
                </div>

                <div class="tiles-grid" id="tiles-grid">
                    ${this.tiles.map(tile => `
                        <div class="tile" data-id="${tile.id}">
                            <div class="tile-inner">
                                <div class="tile-front"></div>
                                <div class="tile-back">${tile.emoji}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button id="start-btn" class="primary-btn">Start Game</button>
            </div>
        `;

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    }

    bindEvents() {
        document.getElementById('tiles-grid').addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile && this.isActive) {
                this.flipTile(parseInt(tile.dataset.id));
            }
        });
    }

    startGame() {
        this.isActive = true;
        document.getElementById('start-btn').style.display = 'none';
        
        this.timer = setInterval(() => {
            this.remainingTime--;
            document.getElementById('time-left').textContent = this.remainingTime;
            
            if (this.remainingTime <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    flipTile(id) {
        const tile = this.tiles[id];
        if (tile.isFlipped || tile.isMatched || this.flippedTiles.length >= 2) return;

        tile.isFlipped = true;
        this.flippedTiles.push(tile);
        this.updateTileDisplay(id);

        if (this.flippedTiles.length === 2) {
            this.moves++;
            document.getElementById('moves-count').textContent = this.moves;
            
            setTimeout(() => this.checkMatch(), 500);
        }
    }

    updateTileDisplay(id) {
        const tile = this.tiles[id];
        const element = document.querySelector(`[data-id="${id}"]`);
        
        if (tile.isMatched) {
            element.classList.add('matched');
        }
        element.classList.toggle('flipped', tile.isFlipped);
    }

    checkMatch() {
        const [tile1, tile2] = this.flippedTiles;
        
        if (tile1.emoji === tile2.emoji) {
            tile1.isMatched = tile2.isMatched = true;
            this.matchedPairs++;
            document.getElementById('pairs-count').textContent = this.matchedPairs;
            playSound('goodResult');
            
            if (this.matchedPairs === this.levelData.pairs) {
                this.completeGame();
            }
        } else {
            tile1.isFlipped = tile2.isFlipped = false;
            this.updateTileDisplay(tile1.id);
            this.updateTileDisplay(tile2.id);
        }
        
        this.flippedTiles = [];
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        const moveBonus = Math.max(0, 100 - this.moves * 2);
        const timeBonus = Math.floor(this.remainingTime * 3);
        const totalPoints = this.levelData.points + moveBonus + timeBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, moveBonus, timeBonus);
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        if (this.matchedPairs === this.levelData.pairs) {
            this.completeGame();
        } else {
            this.showFailureDialog();
        }
    }

    showCompletionDialog(totalPoints, moveBonus, timeBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Level Complete! 🎉</h2>
                <div class="stats-summary">
                    <div class="stat">Pairs Found: ${this.matchedPairs}</div>
                    <div class="stat">Moves Used: ${this.moves}</div>
                    <div class="stat">Time Remaining: ${this.remainingTime}s</div>
                </div>
                <div class="points-breakdown">
                    <div class="point-item">Base Points: ${this.levelData.points}</div>
                    <div class="point-item">Move Bonus: +${moveBonus}</div>
                    <div class="point-item">Time Bonus: +${timeBonus}</div>
                    <div class="total-points">Total Points: ${totalPoints}</div>
                </div>
                <button onclick="gameManager.completeGame(${totalPoints})" class="primary-btn">Continue</button>
            </div>
        `;
        document.getElementById('game-container').appendChild(dialog);
    }

    showFailureDialog() {
        playSound('fail');
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog failure';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Time's Up!</h2>
                <div class="stats-summary">
                    <div class="stat">Pairs Found: ${this.matchedPairs}/${this.levelData.pairs}</div>
                    <div class="stat">Moves Used: ${this.moves}</div>
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
    }
}

// Export game classes and configurations
window.mentalGames = mentalGames;
window.Game2048 = Game2048;
window.ColorMatch = ColorMatch;
window.MemoryTiles = MemoryTiles;