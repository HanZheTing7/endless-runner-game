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
        this.gameSpeed = 2;
        
        // Game objects
        this.player = { x: 150, y: 450, width: 50, height: 80, velocityY: 0, isJumping: false };
        this.ground = { y: 530, height: 70 };
        this.obstacles = [];
        
        // Game physics
        this.gravity = 0.8;
        this.jumpPower = -16;
        
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
        // Create only 1 initial obstacle
        const obstacle = {
            x: 900,
            y: this.ground.y - 50, // Reduced height from 90 to 50
            width: 40,
            height: 50 // Reduced height from 90 to 50
        };
        this.obstacles.push(obstacle);
        console.log('Initial obstacle created:', this.obstacles.length);
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
        if (this.obstacles.length < 1) {
            const newObstacle = {
                x: this.canvas.width + 300,
                y: this.ground.y - 50, // Reduced height from 90 to 50
                width: 40,
                height: 50 // Reduced height from 90 to 50
            };
            this.obstacles.push(newObstacle);
        }
        
        // Update game stats
        this.distance += this.gameSpeed * 0.1;
        this.score = Math.floor(this.distance);
        
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
        
        // Simple local leaderboard for now
        const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
        
        // Get current username
        const username = window.gameManager ? window.gameManager.username : 'Player';
        
        // Check if player already has a score in leaderboard
        const existingPlayerIndex = scores.findIndex(score => score.username === username);
        
        if (existingPlayerIndex !== -1) {
            // Player already exists, check if new score is higher
            const existingScore = scores[existingPlayerIndex];
            if (this.score > existingScore.score) {
                // Replace old score with new higher score
                scores[existingPlayerIndex] = {
                    username: username,
                    score: this.score,
                    distance: Math.floor(this.distance),
                    timestamp: Date.now()
                };
                console.log(`Replaced ${username}'s old score ${existingScore.score} with new score ${this.score}`);
            } else {
                // Keep existing score, don't add duplicate
                console.log(`${username} already has a higher score (${existingScore.score}) than current (${this.score})`);
            }
        } else {
            // New player, add their score
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
        scores.splice(10);
        
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
                <span class="distance">${score.distance}m</span>
            </div>
        `).join('');
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
            this.ctx.fillStyle = '#FF4444';
        });
        
        // Draw player
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw debug info
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Obstacles: ${this.obstacles.length}`, 20, 50);
        this.ctx.fillText(`Game Speed: ${this.gameSpeed}`, 20, 80);
        this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 20, 110);
        this.ctx.fillText(`Jump Power: ${Math.abs(this.jumpPower)}`, 20, 170);
        this.ctx.fillText(`Player Y: ${Math.round(this.player.y)}`, 20, 200);
        
        if (this.obstacles.length > 0) {
            this.ctx.fillText(`First obstacle at: (${Math.round(this.obstacles[0].x)}, ${Math.round(this.obstacles[0].y)})`, 20, 140);
        }
        
        // Draw jump height indicator
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 8]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width/2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y - 180);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
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
    }, 1500); // Increased from 1000 to 1500ms
});
