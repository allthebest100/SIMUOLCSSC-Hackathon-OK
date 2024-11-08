// Game configurations
const games = {
    physical: [
        { id: 'run', name: "Runner's Challenge", description: "Complete running exercises" },
        { id: 'squat', name: "Squat Jumper", description: "Perfect your squat jumps" },
        { id: 'swim', name: "Lane Swimmer", description: "Swimming exercises" }
    ],
    mental: [
        { id: '2048', name: "2048 Challenge", description: "Train your strategic thinking" },
        { id: 'color', name: "Color Match", description: "Test your pattern recognition" },
        { id: 'memory', name: "Memory Tiles", description: "Enhance your memory skills" }
    ]
};

// Show welcome screen
function showWelcome() {
    hideAllScreens();
    document.getElementById('welcome-screen').classList.add('active');
}

// Show games list
function showGames(category) {
    hideAllScreens();
    const gamesScreen = document.getElementById('games-screen');
    const gamesList = document.getElementById('games-list');
    const categoryTitle = document.getElementById('category-title');
    
    // Set title
    categoryTitle.textContent = category === 'physical' ? 'Physical Fitness Games' : 'Mental Health Games';
    
    // Clear and populate games list
    gamesList.innerHTML = '';
    games[category].forEach(game => {
        const button = document.createElement('button');
        button.className = 'game-button';
        button.onclick = () => startGame(game);
        button.innerHTML = `
            <h3>${game.name}</h3>
            <p>${game.description}</p>
        `;
        gamesList.appendChild(button);
    });
    
    gamesScreen.classList.add('active');
}

// Start specific game
function startGame(game) {
    hideAllScreens();
    const gameScreen = document.getElementById('game-screen');
    const gameTitle = document.getElementById('game-title');
    const gameArea = document.getElementById('game-area');
    
    gameTitle.textContent = game.name;
    gameArea.innerHTML = `<p>This is the ${game.name} game area.</p>`;
    
    gameScreen.classList.add('active');
}

// Back to games list
function backToGames() {
    const currentCategory = games.physical.some(g => g.name === document.getElementById('game-title').textContent) 
        ? 'physical' : 'mental';
    showGames(currentCategory);
}

// Utility function to hide all screens
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', showWelcome);