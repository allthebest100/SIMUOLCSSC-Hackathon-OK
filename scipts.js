// Function to handle level up
function levelUp() {
    level++;
    document.getElementById('level').textContent = level;
    
    // Show level up message
    alert(`Congratulations! You've reached level ${level}!`);
    
    // Add more challenging tasks or unlock new features based on level
    if (level === 2) {
        challenges[currentTheme].push("New challenge unlocked!");
    }
}