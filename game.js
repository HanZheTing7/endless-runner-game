// Simple Endless Runner Game
class SimpleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.animationId = null;
        
        // Game state
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = 2.5; // Increased from 2 to 2.5 for better pacing
        this.obstacleFrequency = 1; // Start with 1 obstacle, increases with difficulty
        
        // Game objects
        this.player = { x: 150, y: 450, width: 50, height: 80, velocityY: 0, isJumping: false };
        this.ground = { y: 530, height: 70 };
        this.obstacles = [];
        
        // Game physics
        this.gravity = 0.6; // Reduced from 0.8 to make jump last longer
        this.jumpPower = -20; // Increased from -16 to make jump higher
        
        // Character image
        this.characterHead = new Image();
        this.characterHead.src = 'character-head.png'; // You can change this to your image file
        
        this.init();
    }
    
    init() {
        console.log('Initializing SimpleGame');
        
        // Check if canvas element exists
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        // Check if all required DOM elements are available
        this.checkDOMElements();
        
        this.setupCanvas();
        this.setupControls();
        this.createInitialObstacles();
    }
    
    checkDOMElements() {
        const requiredElements = [
            'finalScore',
            'finalDistance', 
            'gameOverScreen',
            'gameScreen',
            'leaderboard',
            'playerRank'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.warn('Missing DOM elements:', missingElements);
        } else {
            console.log('All required DOM elements found');
        }
    }
    
    setupCanvas() {
        this.canvas.width = 1200;
        this.canvas.height = 600;
        console.log('Canvas setup - Width:', this.canvas.width, 'Height:', this.canvas.height);
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameRunning && (e.code === 'Space' || e.code === 'ArrowUp')) {
                e.preventDefault();
                this.jump();
            }
        });
    }
    
    createInitialObstacles() {
        // Create only 1 initial obstacle with random height
        const obstacle = this.createRandomObstacle(900);
        this.obstacles.push(obstacle);
        console.log('Initial obstacle created:', this.obstacles.length);
    }
    
    createRandomObstacle(x) {
        // Calculate maximum jump height (player can jump 220px up from ground)
        const maxJumpHeight = this.ground.y - 220;
        
        // Random height between 30 and 80 pixels (ensuring it's clearable)
        const minHeight = 30;
        const maxHeight = Math.min(80, this.ground.y - maxJumpHeight - 20); // Ensure clearance
        
        const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        // Random width between 30 and 50 pixels
        const width = Math.floor(Math.random() * (50 - 30 + 1)) + 30;
        
        // Position obstacle so it's always clearable
        const y = this.ground.y - height;
        
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }
    
    updateDifficulty() {
        // Increase game speed every 500 distance units
        const speedIncrease = Math.floor(this.distance / 500);
        this.gameSpeed = 2.5 + (speedIncrease * 0.5);
        
        // Cap maximum speed at 6.0
        this.gameSpeed = Math.min(this.gameSpeed, 6.0);
        
        // Increase obstacle frequency every 1000 distance units
        const frequencyIncrease = Math.floor(this.distance / 1000);
        this.obstacleFrequency = 1 + frequencyIncrease;
        
        // Cap maximum obstacle frequency at 3
        this.obstacleFrequency = Math.min(this.obstacleFrequency, 3);
    }
    
    jump() {
        if (!this.player.isJumping) {
            this.player.isJumping = true;
            this.player.velocityY = this.jumpPower;
        }
    }
    
    start() {
        // Final check that game over elements exist
        const gameOverElements = [
            'finalScore',
            'finalDistance',
            'gameOverScreen',
            'gameScreen'
        ];
        
        const missingElements = gameOverElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Game over elements missing:', missingElements);
            alert('Game cannot start properly. Please refresh the page.');
            return;
        }
        
        this.gameRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        this.update();
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update player
        if (this.player.isJumping) {
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;
            
            if (this.player.y >= this.ground.y - this.player.height) {
                this.player.y = this.ground.y - this.player.height;
                this.player.isJumping = false;
                this.player.velocityY = 0;
            }
        }
        
        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x -= this.gameSpeed;
        });
        
        // Remove obstacles that are off screen
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > -50);
        
        // Add new obstacles if needed
        if (this.obstacles.length < this.obstacleFrequency) {
            const newObstacle = this.createRandomObstacle(this.canvas.width + 300);
            this.obstacles.push(newObstacle);
        }
        
        // Update game stats
        this.distance += this.gameSpeed * 0.1;
        this.score = Math.floor(this.distance);
        
        // Progressive difficulty based on distance
        this.updateDifficulty();
        
        // Update UI
        const currentScoreElement = document.getElementById('currentScore');
        const currentDistanceElement = document.getElementById('currentDistance');
        
        if (currentScoreElement) {
            currentScoreElement.textContent = this.score;
        }
        
        if (currentDistanceElement) {
            currentDistanceElement.textContent = Math.floor(this.distance);
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    checkCollisions() {
        this.obstacles.forEach(obstacle => {
            if (this.player.x < obstacle.x + obstacle.width &&
                this.player.x + this.player.width > obstacle.x &&
                this.player.y < obstacle.y + obstacle.height &&
                this.player.y + this.player.height > obstacle.y) {
                this.gameOver();
            }
        });
    }
    
    gameOver() {
        this.stop();
        console.log('Game Over triggered. Score:', this.score, 'Distance:', this.distance);
        
        // Check if elements exist before trying to access them
        const finalScoreElement = document.getElementById('finalScore');
        const finalDistanceElement = document.getElementById('finalDistance');
        const gameOverScreenElement = document.getElementById('gameOverScreen');
        const gameScreenElement = document.getElementById('gameScreen');
        
        console.log('Elements found:', {
            finalScore: !!finalScoreElement,
            finalDistance: !!finalDistanceElement,
            gameOverScreen: !!gameOverScreenElement,
            gameScreen: !!gameScreenElement
        });
        
        // Only try to update elements if they exist
        if (finalScoreElement) {
            finalScoreElement.textContent = this.score;
        } else {
            console.warn('finalScore element not found');
        }
        
        if (finalDistanceElement) {
            finalDistanceElement.textContent = Math.floor(this.distance);
        } else {
            console.warn('finalDistance element not found');
        }
        
        // Show game over screen
        if (gameOverScreenElement && gameScreenElement) {
            try {
                gameOverScreenElement.classList.add('active');
                gameScreenElement.classList.remove('active');
                console.log('Game over screen shown successfully');
                
                // Load leaderboard after screen is shown
                setTimeout(() => {
                    this.loadLeaderboard();
                }, 100);
            } catch (error) {
                console.error('Error showing game over screen:', error);
                // Fallback to alert
                alert(`Game Over! Score: ${this.score}, Distance: ${Math.floor(this.distance)}m`);
            }
        } else {
            console.warn('Game over screen elements not found, using fallback');
            // Fallback if elements don't exist
            alert(`Game Over! Score: ${this.score}, Distance: ${Math.floor(this.distance)}m`);
        }
    }
    
    loadLeaderboard() {
        // Check if elements exist before trying to access them
        const leaderboardElement = document.getElementById('leaderboard');
        const playerRankElement = document.getElementById('playerRank');
        
        if (!leaderboardElement || !playerRankElement) {
            console.error('Leaderboard elements not found');
            return;
        }
        
        // Clean up any existing duplicates first
        this.cleanupLeaderboard();
        
        // Simple local leaderboard for now
        let scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
        
        // Get current username
        const username = window.gameManager ? window.gameManager.username : 'Player';
        
        // Check if player already has a score and compare with current score
        const existingPlayerScore = scores.find(score => score.username === username);
        
        if (existingPlayerScore) {
            // Player exists - only update if new score is higher
            if (this.score > existingPlayerScore.score) {
                // New score is higher - update it
                existingPlayerScore.score = this.score;
                existingPlayerScore.distance = Math.floor(this.distance);
                existingPlayerScore.timestamp = Date.now();
                console.log(`Updated ${username} with higher score: ${this.score} (was: ${existingPlayerScore.score})`);
            } else {
                // New score is lower - keep the old higher score
                console.log(`Keeping ${username}'s higher score: ${existingPlayerScore.score} (new was: ${this.score})`);
            }
        } else {
            // New player - add their score
            scores.push({
                username: username,
                score: this.score,
                distance: Math.floor(this.distance),
                timestamp: Date.now()
            });
            console.log(`Added new player ${username} with score ${this.score}`);
        }
        
        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        scores = scores.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('endlessRunnerScores', JSON.stringify(scores));
        
        // Find player rank
        const playerRank = scores.findIndex(score => score.username === username) + 1;
        
        playerRankElement.textContent = playerRank;
        
        // Display leaderboard
        leaderboardElement.innerHTML = scores.map((score, index) => `
            <div class="leaderboard-item ${score.username === username ? 'current-player' : ''}">
                <span class="rank">${index + 1}</span>
                <span class="username">${score.username}</span>
                <span class="score">${score.score}</span>
            </div>
        `).join('');
        
        // Log the final leaderboard for debugging
        console.log('Final leaderboard:', scores.map(s => `${s.username}: ${s.score}`));
    }
    
    cleanupLeaderboard() {
        // Get current leaderboard
        let scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
        
        // Create a map to keep only the highest score for each username
        const uniqueScores = new Map();
        
        scores.forEach(score => {
            if (!uniqueScores.has(score.username) || score.score > uniqueScores.get(score.username).score) {
                uniqueScores.set(score.username, score);
            }
        });
        
        // Convert back to array and sort
        const cleanedScores = Array.from(uniqueScores.values()).sort((a, b) => b.score - a.score);
        
        // Save cleaned leaderboard
        localStorage.setItem('endlessRunnerScores', JSON.stringify(cleanedScores));
        
        console.log('Cleaned leaderboard, removed duplicates. New count:', cleanedScores.length);
    }
    
    clearLeaderboard() {
        // Clear all leaderboard data
        localStorage.removeItem('endlessRunnerScores');
        console.log('Leaderboard completely cleared');
        
        // Update the display to show empty leaderboard
        const leaderboardElement = document.getElementById('leaderboard');
        const playerRankElement = document.getElementById('playerRank');
        
        if (leaderboardElement) {
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
        }
        
        if (playerRankElement) {
            playerRankElement.textContent = '-';
        }
    }
    
    // Static method to clear leaderboard from anywhere
    static clearLeaderboardGlobal() {
        // Clear all leaderboard data
        localStorage.removeItem('endlessRunnerScores');
        console.log('Leaderboard completely cleared globally');
        
        // Update the display to show empty leaderboard
        const leaderboardElement = document.getElementById('leaderboard');
        const playerRankElement = document.getElementById('playerRank');
        
        if (leaderboardElement) {
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
        }
        
        if (playerRankElement) {
            playerRankElement.textContent = '-';
        }
    }
    
    render() {
        // Check if canvas and context exist
        if (!this.canvas || !this.ctx) {
            console.error('Canvas or context not available');
            return;
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Draw obstacles
        this.ctx.fillStyle = '#FF4444';
        this.obstacles.forEach((obstacle, index) => {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add obstacle number
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${index + 1}`, obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 10);
            
            // Add clearance indicator (green if clearable, red if not)
            const jumpHeight = this.player.y - 220;
            const canClear = jumpHeight < obstacle.y;
            this.ctx.fillStyle = canClear ? '#00FF00' : '#FF0000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(canClear ? 'CLEAR' : 'BLOCK', obstacle.x + obstacle.width/2, obstacle.y - 10);
            
            // Add difficulty indicator (based on obstacle size)
            const difficulty = Math.round((obstacle.height * obstacle.width) / 100); // Simple difficulty calculation
            this.ctx.fillStyle = difficulty <= 2 ? '#00FF00' : difficulty <= 3 ? '#FFFF00' : '#FF6600';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`L${difficulty}`, obstacle.x + obstacle.width/2, obstacle.y + obstacle.height + 20);
            
            this.ctx.fillStyle = '#FF4444';
        });
        
        // Draw player
        this.drawStickman(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw debug info
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Obstacles: ${this.obstacles.length}`, 20, 50);
        this.ctx.fillText(`Game Speed: ${this.gameSpeed.toFixed(1)}`, 20, 80);
        this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 20, 110);
        this.ctx.fillText(`Jump Power: ${Math.abs(this.jumpPower)}`, 20, 170);
        this.ctx.fillText(`Player Y: ${Math.round(this.player.y)}`, 20, 200);
        this.ctx.fillText(`Gravity: ${this.gravity}`, 20, 230);
        this.ctx.fillText(`Difficulty: ${this.obstacleFrequency} obstacle(s)`, 20, 260);
        
        if (this.obstacles.length > 0) {
            this.ctx.fillText(`First obstacle at: (${Math.round(this.obstacles[0].x)}, ${Math.round(this.obstacles[0].y)})`, 20, 140);
            // Show if player can clear the obstacle
            const obstacleHeight = this.obstacles[0].y;
            const jumpHeight = this.player.y - 220; // Match the indicator line
            const canClear = jumpHeight < obstacleHeight;
            this.ctx.fillStyle = canClear ? '#00FF00' : '#FF0000';
            this.ctx.fillText(`Can clear: ${canClear ? 'YES' : 'NO'}`, 20, 260);
            this.ctx.fillStyle = '#FFFFFF';
        }
        
        // Draw jump height indicator
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width/2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y - 220); // Increased from 180 to 220 to show new jump height
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawStickman(x, y, width, height) {
        const ctx = this.ctx;
        const centerX = x + width / 2;
        
        // Draw head using image instead of circle
        if (this.characterHead.complete) {
            const headSize = height * 0.8; // Increased from 0.24 to 0.4 to make head bigger
            ctx.drawImage(
                this.characterHead, 
                centerX - headSize/2, 
                y + height * 0.03, 
                headSize, 
                headSize
            );
        } else {
            // Fallback to circle if image isn't loaded yet
            ctx.beginPath();
            ctx.arc(centerX, y + height * 0.15, height * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.closePath();
        }
        
        // Draw body (vertical line)
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX, y + height * 0.65);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = height * 0.08;
        ctx.stroke();
        ctx.closePath();
        
        // Realistic running animation - running to the right with forward momentum
        if (this.player.isJumping) {
            // Jumping pose - arms up, legs together
            ctx.beginPath();
            ctx.moveTo(centerX, y + height * 0.3);
            ctx.lineTo(centerX - width * 0.2, y + height * 0.1);
            ctx.lineTo(centerX + width * 0.2, y + height * 0.1);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = height * 0.04;
            ctx.stroke();
            ctx.closePath();
            
            ctx.beginPath();
            ctx.moveTo(centerX, y + height * 0.65);
            ctx.lineTo(centerX, y + height * 0.9);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = height * 0.06;
            ctx.stroke();
            ctx.closePath();
        } else {
            // Realistic running animation - running to the right with forward momentum
            const time = Date.now() * 0.008; // Slightly slower for more realistic timing
            
            // Calculate running cycle (0 to 2π)
            const cycle = (time * 2) % (Math.PI * 2);
            
            // Body bounce (up and down movement)
            const bodyBounce = Math.sin(cycle * 2) * 0.02;
            
            // Hip rotation (side to side movement)
            const hipRotation = Math.sin(cycle * 2) * 0.03;
            
            // Arm swing calculations - forward/backward movement for running to the right
            const leftArmAngle = Math.sin(cycle * 2) * 0.4; // Left arm swings
            const rightArmAngle = Math.sin(cycle * 2 + Math.PI) * 0.4; // Right arm opposite
            
            // Leg movement calculations - forward/backward movement for running to the right
            const leftLegAngle = Math.sin(cycle * 2) * 0.5; // Left leg swings
            const rightLegAngle = Math.sin(cycle * 2 + Math.PI) * 0.5; // Right leg opposite
            
            // Apply body bounce to all positions
            const bounceOffset = height * bodyBounce;
            const hipOffset = width * hipRotation;
            
            // Draw arms with forward/backward movement (running to the right)
            // Left arm - forward/backward swing
            ctx.beginPath();
            ctx.moveTo(centerX + hipOffset, y + height * 0.3 + bounceOffset);
            ctx.lineTo(
                centerX - width * (0.2 + leftArmAngle * 0.3) + hipOffset, 
                y + height * (0.35 - leftArmAngle * 0.4) + bounceOffset
            );
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = height * 0.04;
            ctx.stroke();
            ctx.closePath();
            
            // Right arm - forward/backward swing
            ctx.beginPath();
            ctx.moveTo(centerX + hipOffset, y + height * 0.3 + bounceOffset);
            ctx.lineTo(
                centerX + width * (0.2 + rightArmAngle * 0.3) + hipOffset, 
                y + height * (0.35 - rightArmAngle * 0.4) + bounceOffset
            );
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = height * 0.04;
            ctx.stroke();
            ctx.closePath();
            
            // Draw legs with forward/backward movement (running to the right)
            // Left leg - forward/backward swing
            ctx.beginPath();
            ctx.moveTo(centerX + hipOffset, y + height * 0.65 + bounceOffset);
            ctx.lineTo(
                centerX - width * (0.1 + leftLegAngle * 0.2) + hipOffset, 
                y + height * (0.9 - leftLegAngle * 0.5) + bounceOffset
            );
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = height * 0.06;
            ctx.stroke();
            ctx.closePath();
            
            // Right leg - forward/backward swing
            ctx.beginPath();
            ctx.moveTo(centerX + hipOffset, y + height * 0.65 + bounceOffset);
            ctx.lineTo(
                centerX + width * (0.1 + rightLegAngle * 0.2) + hipOffset, 
                y + height * (0.9 - rightLegAngle * 0.5) + bounceOffset
            );
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = height * 0.06;
            ctx.stroke();
            ctx.closePath();
        }
        
        // Remove eyes and smile since we're using an image for the head
        // The image should have the face details already
    }
}

// Game Manager
class GameManager {
    constructor() {
        this.currentScreen = 'start';
        this.username = '';
        this.gameRunning = false;
        this.game = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showScreen('start');
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Clear leaderboard button (start screen)
        document.getElementById('clearLeaderboardStartButton').addEventListener('click', () => {
            this.clearLeaderboard();
        });
        
        // Username input
        document.getElementById('username').addEventListener('input', (e) => {
            this.username = e.target.value.trim();
            this.validateUsername();
        });
        
        // Game control buttons
        document.getElementById('jumpBtn').addEventListener('click', () => {
            if (this.game) this.game.jump();
        });
        
        // Game over buttons
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('mainMenuButton').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        // Clear leaderboard button
        document.getElementById('clearLeaderboardButton').addEventListener('click', () => {
            this.clearLeaderboard();
        });
    }
    
    validateUsername() {
        const errorElement = document.getElementById('usernameError');
        const startButton = document.getElementById('startButton');
        
        if (this.username.length < 3) {
            errorElement.textContent = 'Username must be at least 3 characters long';
            startButton.disabled = true;
            return false;
        }
        
        if (this.username.length > 20) {
            errorElement.textContent = 'Username must be less than 20 characters';
            startButton.disabled = true;
            return false;
        }
        
        errorElement.textContent = '';
        startButton.disabled = false;
        return true;
    }
    
    startGame() {
        if (!this.username || this.username.length < 3) {
            alert('Please enter a valid username');
            return;
        }
        
        // Check if all required game elements exist
        const requiredGameElements = [
            'gameCanvas',
            'currentScore',
            'currentDistance'
        ];
        
        const missingElements = requiredGameElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Game elements missing:', missingElements);
            alert('Game cannot start. Please refresh the page.');
            return;
        }
        
        this.showScreen('game');
        this.gameRunning = true;
        
        // Initialize game
        this.game = new SimpleGame();
        this.game.start();
    }
    
    restartGame() {
        this.showScreen('game');
        this.gameRunning = true;
        
        this.game = new SimpleGame();
        this.game.start();
    }
    
    showMainMenu() {
        this.showScreen('start');
        document.getElementById('username').value = '';
        this.username = '';
        document.getElementById('usernameError').textContent = '';
        document.getElementById('startButton').disabled = true;
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenName + 'Screen').classList.add('active');
        this.currentScreen = screenName;
    }

    clearLeaderboard() {
        // Clear all leaderboard data
        localStorage.removeItem('endlessRunnerScores');
        console.log('Leaderboard completely cleared');
        
        // Update the display to show empty leaderboard
        const leaderboardElement = document.getElementById('leaderboard');
        const playerRankElement = document.getElementById('playerRank');
        
        if (leaderboardElement) {
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
        }
        
        if (playerRankElement) {
            playerRankElement.textContent = '-';
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Show loading screen first
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('active');
    }
    
    // Wait a bit more to ensure all elements are fully loaded
    setTimeout(() => {
        console.log('Initializing GameManager');
        
        // Double-check that all required elements exist
        const requiredElements = [
            'startScreen',
            'gameScreen', 
            'gameOverScreen',
            'finalScore',
            'finalDistance',
            'leaderboard',
            'playerRank'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Critical DOM elements missing:', missingElements);
            alert('Game initialization failed. Please refresh the page.');
            return;
        }
        
        const gameManager = new GameManager();
        window.gameManager = gameManager;
        console.log('GameManager initialized successfully');
        
        // Add global function to clear leaderboard from console
        window.clearLeaderboard = () => {
            localStorage.removeItem('endlessRunnerScores');
            console.log('Leaderboard cleared via console command');
            
            // Update display if on game over screen
            const leaderboardElement = document.getElementById('leaderboard');
            const playerRankElement = document.getElementById('playerRank');
            
            if (leaderboardElement) {
                leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
            }
            
            if (playerRankElement) {
                playerRankElement.textContent = '-';
            }
        };
        
        console.log('Type "clearLeaderboard()" in console to clear leaderboard');
    }, 1500); // Increased from 1000 to 1500ms
});
