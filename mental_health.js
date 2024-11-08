// Mental Games Configuration
const mentalGames = {
    puzzle2048: {
        id: 'puzzle2048',
        name: "2048 Challenge",
        icon: '🎮',
        description: "Train your strategic thinking",
        unlockLevel: 1,
        levels: [
            { target: 256, moves: 50, points: 100, name: "Beginner 2048" },
            { target: 512, moves: 100, points: 200, name: "Advanced 2048" },
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

// Start Mental Game
function startMentalGame(gameId) {
    const gameContainer = document.getElementById('active-game-container');
    const game = mentalGames[gameId];
    
    switch(gameId) {
        case 'puzzle2048':
            currentGame = new Game2048(1);
            break;
        case 'colorMatch':
            currentGame = new ColorMatch(1);
            break;
        case 'memoryTiles':
            currentGame = new MemoryTiles(1);
            break;
    }
    
    if (currentGame) {
        currentGame.initialize();
    }
}

// 2048 Game
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
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="game-2048">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <div class="stat">
                            <i class="fas fa-star"></i>
                            Score: <span id="current-score">0</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-arrows-alt"></i>
                            Moves: <span id="moves-left">${this.levelData.moves}</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-bullseye"></i>
                            Target: ${this.levelData.target}
                        </div>
                    </div>
                </div>
                
                <div class="game-grid">
                    ${this.createGridHTML()}
                </div>

                <div class="controls">
                    <button id="restart-btn" class="game-button">Restart</button>
                    <div class="instructions">
                        <p>Use arrow keys to move tiles</p>
                        <p>Combine same numbers to reach ${this.levelData.target}</p>
                    </div>
                </div>
            </div>
        `;

        this.updateGrid();
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    createGridHTML() {
        return Array(4).fill()
            .map(() => `
                <div class="grid-row">
                    ${Array(4).fill('<div class="grid-cell"></div>').join('')}
                </div>
            `).join('');
    }

    bindEvents() {
        this.handleKeyPress = (e) => {
            if (!this.isActive) return;

            let moved = false;
            switch(e.key) {
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
        };

        document.addEventListener('keydown', this.handleKeyPress);
        this.isActive = true;
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
            let row = grid[i].filter(cell => cell !== 0);
            let merged = [];

            if (left) {
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j] === row[j + 1] && !merged.includes(j)) {
                        row[j] *= 2;
                        this.score += row[j];
                        this.highestTile = Math.max(this.highestTile, row[j]);
                        row.splice(j + 1, 1);
                        merged.push(j);
                        moved = true;
                    }
                }
                while (row.length < 4) row.push(0);
            } else {
                for (let j = row.length - 1; j > 0; j--) {
                    if (row[j] === row[j - 1] && !merged.includes(j)) {
                        row[j] *= 2;
                        this.score += row[j];
                        this.highestTile = Math.max(this.highestTile, row[j]);
                        row.splice(j - 1, 1);
                        merged.push(j);
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
            let merged = [];

            if (up) {
                for (let i = 0; i < column.length - 1; i++) {
                    if (column[i] === column[i + 1] && !merged.includes(i)) {
                        column[i] *= 2;
                        this.score += column[i];
                        this.highestTile = Math.max(this.highestTile, column[i]);
                        column.splice(i + 1, 1);
                        merged.push(i);
                        moved = true;
                    }
                }
                while (column.length < 4) column.push(0);
            } else {
                for (let i = column.length - 1; i > 0; i--) {
                    if (column[i] === column[i - 1] && !merged.includes(i)) {
                        column[i] *= 2;
                        this.score += column[i];
                        this.highestTile = Math.max(this.highestTile, column[i]);
                        column.splice(i - 1, 1);
                        merged.push(i);
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
        const gridElement = document.querySelector('.game-grid');
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = gridElement.children[i].children[j];
                const value = this.grid[i][j];
                cell.textContent = value || '';
                cell.className = `grid-cell tile-${value}`;
                if (value) {
                    cell.classList.add('tile-pop');
                    setTimeout(() => cell.classList.remove('tile-pop'), 300);
                }
            }
        }

        document.getElementById('current-score').textContent = this.score;
        document.getElementById('moves-left').textContent = this.levelData.moves - this.moves;
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
                if ((j < 3 && current === this.grid[i][j + 1]) ||
                    (i < 3 && current === this.grid[i + 1][j])) {
                    return true;
                }
            }
        }
        return false;
    }

    completeGame() {
        this.isActive = false;
        const moveBonus = Math.max(0, this.levelData.moves - this.moves) * 5;
        const totalPoints = this.levelData.points + moveBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, moveBonus);
    }

    failGame() {
        this.isActive = false;
        playSound('fail');
        this.showFailDialog();
    }

    showCompletionDialog(totalPoints, moveBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Level Complete! 🎉</h2>
                <div class="stats-summary">
                    <p>Highest Tile: ${this.highestTile}</p>
                    <p>Moves Used: ${this.moves}</p>
                    <p>Score: ${this.score}</p>
                </div>
                <div class="points-breakdown">
                    <p>Base Points: ${this.levelData.points}</p>
                    <p>Move Bonus: +${moveBonus}</p>
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
                <h2>Game Over!</h2>
                <div class="stats-summary">
                    <p>Highest Tile: ${this.highestTile}</p>
                    <p>Target: ${this.levelData.target}</p>
                    <p>Score: ${this.score}</p>
                </div>
                <div class="action-buttons">
                    <button onclick="retryGame()" class="game-button">Try Again</button>
                    <button onclick="returnToSelection()" class="game-button secondary">Exit</button>
                </div>
            </div>
        `;
        document.getElementById('active-game-container').appendChild(dialog);
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

// Color Match Game
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
        this.timeLeft = this.levelData.time;
    }

    initialize() {
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    renderUI() {
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="color-match-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            Time: <span id="time-left">${this.timeLeft}</span>s
                        </div>
                        <div class="stat">
                            <i class="fas fa-star"></i>
                            Score: <span id="current-score">${this.score}</span>
                        </div>
                    </div>
                </div>

                <div class="game-area">
                    <div id="pattern-display" class="pattern-display"></div>
                    <div id="color-buttons" class="color-buttons">
                        ${this.colors.map((color, index) => `
                            <button 
                                class="color-btn" 
                                data-color="${index}"
                                style="background-color: ${color}">
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Round</button>
                    <div class="instructions">
                        <p>Watch the pattern and repeat it</p>
                        <p>Pattern length increases with each success</p>
                    </div>
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
        document.getElementById('start-btn').style.display = 'none';
        
        this.generateSequence();
        this.showSequence();
        
        // Start timer
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    generateSequence() {
        const length = Math.min(3 + Math.floor(this.score / 50), 8);
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

        const display = document.getElementById('pattern-display');
        display.style.backgroundColor = this.colors[colorIndex];
        setTimeout(() => display.style.backgroundColor = '#fff', 200);

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
            if (this.score >= this.levelData.points) {
                this.completeGame();
            } else {
                this.startRound();
            }
        }, 1000);
    }

    failRound() {
        playSound('fail');
        const display = document.getElementById('pattern-display');
        display.style.backgroundColor = '#FF0000';
        
        setTimeout(() => {
            display.style.backgroundColor = '#fff';
            if (this.score >= this.levelData.points) {
                this.completeGame();
            } else {
                this.startRound();
            }
        }, 1000);
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        const timeBonus = this.timeLeft * 2;
        const totalPoints = this.levelData.points + timeBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, timeBonus);
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        if (this.score >= this.levelData.points) {
            this.completeGame();
        } else {
            this.showFailDialog();
        }
    }

    showCompletionDialog(totalPoints, timeBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Level Complete! 🎉</h2>
                <div class="stats-summary">
                    <p>Score: ${this.score}</p>
                    <p>Time Remaining: ${this.timeLeft}s</p>
                </div>
                <div class="points-breakdown">
                    <p>Base Points: ${this.levelData.points}</p>
                    <p>Time Bonus: +${timeBonus}</p>
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
                <h2>Time's Up!</h2>
                <div class="stats-summary">
                    <p>Final Score: ${this.score}</p>
                    <p>Target Score: ${this.levelData.points}</p>
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
    }
}

// Memory Tiles Game
class MemoryTiles {
    constructor(level) {
        this.level = level;
        this.levelData = mentalGames.memoryTiles.levels[level - 1];
        this.tiles = [];
        this.flippedTiles = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.isActive = false;
        this.timeLeft = this.levelData.time;
        this.timer = null;
    }

    initialize() {
        this.createTiles();
        this.renderUI();
        this.bindEvents();
        playSound('newLevel');
    }

    createTiles() {
        const emojis = ['🎮', '🎨', '🎲', '🎯', '🎪', '🎭', '🎸', '🎺', '🎨', '🎪', '🎭', '🎲'];
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
        const container = document.getElementById('active-game-container');
        container.innerHTML = `
            <div class="memory-game">
                <div class="game-header">
                    <h2>${this.levelData.name}</h2>
                    <div class="game-stats">
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            Time: <span id="time-left">${this.timeLeft}</span>s
                        </div>
                        <div class="stat">
                            <i class="fas fa-sync"></i>
                            Moves: <span id="move-count">0</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-puzzle-piece"></i>
                            Pairs: <span id="pairs-found">0</span>/${this.levelData.pairs}
                        </div>
                    </div>
                </div>

                <div class="tiles-grid">
                    ${this.tiles.map(tile => `
                        <div class="tile" data-id="${tile.id}">
                            <div class="tile-inner">
                                <div class="tile-front"></div>
                                <div class="tile-back">${tile.emoji}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="controls">
                    <button id="start-btn" class="game-button">Start Game</button>
                    <div class="instructions">
                        <p>Find matching pairs of tiles</p>
                        <p>Remember locations for better score</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
    }

    bindEvents() {
        const tilesGrid = document.querySelector('.tiles-grid');
        tilesGrid.addEventListener('click', (e) => {
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
            this.timeLeft--;
            document.getElementById('time-left').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
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
            document.getElementById('move-count').textContent = this.moves;
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
            document.getElementById('pairs-found').textContent = this.matchedPairs;
            playSound('goodResult');
            
            if (this.matchedPairs === this.levelData.pairs) {
                this.completeGame();
            }
        } else {
            tile1.isFlipped = tile2.isFlipped = false;
            setTimeout(() => {
                this.updateTileDisplay(tile1.id);
                this.updateTileDisplay(tile2.id);
            }, 500);
        }
        
        this.flippedTiles = [];
    }

    completeGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        const timeBonus = Math.floor(this.timeLeft * 2);
        const moveBonus = Math.max(0, 100 - this.moves * 2);
        const totalPoints = this.levelData.points + timeBonus + moveBonus;
        
        playSound('success');
        this.showCompletionDialog(totalPoints, timeBonus, moveBonus);
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);
        
        if (this.matchedPairs === this.levelData.pairs) {
            this.completeGame();
        } else {
            playSound('fail');
            this.showFailDialog();
        }
    }

    showCompletionDialog(totalPoints, timeBonus, moveBonus) {
        const dialog = document.createElement('div');
        dialog.className = 'completion-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>Level Complete! 🎉</h2>
                <div class="stats-summary">
                    <p>Pairs Found: ${this.matchedPairs}/${this.levelData.pairs}</p>
                    <p>Moves Used: ${this.moves}</p>
                    <p>Time Remaining: ${this.timeLeft}s</p>
                </div>
                <div class="points-breakdown">
                    <p>Base Points: ${this.levelData.points}</p>
                    <p>Time Bonus: +${timeBonus}</p>
                    <p>Efficiency Bonus: +${moveBonus}</p>
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
                <h2>Time's Up!</h2>
                <div class="stats-summary">
                    <p>Pairs Found: ${this.matchedPairs}/${this.levelData.pairs}</p>
                    <p>Moves Used: ${this.moves}</p>
                </div>
                <div class="action-buttons">
                    <button onclick="retryGame()" class="game-button">Try Again</button>
                    <button onclick="returnToSelection()" class="game-button secondary">Exit</button>
</div>
        `;
        document.getElementById('active-game-container').appendChild(dialog);
    }

    cleanup() {
        clearInterval(this.timer);
    }
}

// Export game components
window.mentalGames = mentalGames;
window.startMentalGame = startMentalGame;
window.Game2048 = Game2048;
window.ColorMatch = ColorMatch;
window.MemoryTiles = MemoryTiles;
