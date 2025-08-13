// Game State Management
class GameManager {
    constructor() {
        this.currentScreen = 'start';
        this.username = '';
        this.gameRunning = false;
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = 5;
        this.maxSpeed = 15;
        
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

        // Username input validation
        document.getElementById('username').addEventListener('input', (e) => {
            this.username = e.target.value.trim();
            this.validateUsername();
        });

        // Game control buttons
        document.getElementById('jumpBtn').addEventListener('click', () => {
            this.game.jump();
        });

        // Game over screen buttons
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('mainMenuButton').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameRunning) {
                switch(e.code) {
                    case 'Space':
                    case 'ArrowUp':
                        e.preventDefault();
                        this.game.jump();
                        break;
                }
            }
        });

        // Touch controls for mobile
        let touchStartY = 0;
        let touchStartTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            if (this.gameRunning) {
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
            }
        });

        document.addEventListener('touchend', (e) => {
            if (this.gameRunning) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                const touchDistance = Math.abs(touchEndY - touchStartY);

                if (touchDuration < 200 && touchDistance < 50) {
                    // Quick tap - jump
                    this.game.jump();
                }
            }
        });
    }

    async validateUsername() {
        const usernameInput = document.getElementById('username');
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

        // Check if username already exists
        try {
            const exists = await FirebaseHelper.checkUsernameExists(this.username);
            if (exists) {
                errorElement.textContent = 'Username already exists. Please choose another one.';
                startButton.disabled = true;
                return false;
            }
        } catch (error) {
            console.error('Error checking username:', error);
            // Continue if we can't check (offline mode)
        }

        errorElement.textContent = '';
        startButton.disabled = false;
        return true;
    }

    async startGame() {
        if (!this.username || this.username.length < 3) {
            alert('Please enter a valid username');
            return;
        }

        this.showScreen('game');
        this.gameRunning = true;
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = 5; // Ensure this is a valid number

        // Initialize game
        this.game = new Game(this);
        this.game.start();
    }

    gameOver() {
        this.gameRunning = false;
        this.game.stop();
        
        // Save score to leaderboard
        this.saveScore();
        
        // Show game over screen
        this.showGameOverScreen();
    }

    async saveScore() {
        try {
            await FirebaseHelper.saveScore(this.username, this.score, this.distance);
        } catch (error) {
            console.error('Error saving score:', error);
        }
    }

    async showGameOverScreen() {
        // Get player rank
        let playerRank = -1;
        try {
            playerRank = await FirebaseHelper.getPlayerRank(this.score);
        } catch (error) {
            console.error('Error getting player rank:', error);
        }

        // Update final score display
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalDistance').textContent = this.distance;
        document.getElementById('playerRank').textContent = playerRank > 0 ? `#${playerRank}` : 'N/A';

        // Load and display leaderboard
        await this.loadLeaderboard();

        this.showScreen('gameOver');
    }

    async loadLeaderboard() {
        try {
            const topScores = await FirebaseHelper.getTopScores(10);
            const leaderboardElement = document.getElementById('leaderboard');
            
            leaderboardElement.innerHTML = '';
            
            topScores.forEach((scoreData, index) => {
                const isCurrentPlayer = scoreData.username === this.username;
                const item = document.createElement('div');
                item.className = `leaderboard-item ${isCurrentPlayer ? 'current-player' : ''}`;
                
                item.innerHTML = `
                    <span class="rank">#${index + 1}</span>
                    <span class="username">${scoreData.username}</span>
                    <span class="score">${scoreData.score}</span>
                `;
                
                leaderboardElement.appendChild(item);
            });
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            document.getElementById('leaderboard').innerHTML = '<p>Error loading leaderboard</p>';
        }
    }

    restartGame() {
        this.showScreen('game');
        this.gameRunning = true;
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = 5; // Ensure this is a valid number
        
        this.game = new Game(this);
        this.game.start();
    }

    showMainMenu() {
        this.showScreen('start');
        this.username = '';
        document.getElementById('username').value = '';
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

    updateScore(points) {
        this.score += points;
        document.getElementById('currentScore').textContent = this.score;
    }

    updateDistance(meters) {
        this.distance = Math.floor(meters);
        document.getElementById('currentDistance').textContent = this.distance;
        
        // Increase game speed over time with safety checks
        if (this.gameSpeed < this.maxSpeed) {
            const newSpeed = 5 + (this.distance / 100) * 2;
            // Only update if the new speed is a valid number
            if (!isNaN(newSpeed) && isFinite(newSpeed)) {
                this.gameSpeed = newSpeed;
            }
        }
    }
}

// Game Class
class Game {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.lastTime = 0;
        
        this.setupCanvas();
        this.initGameObjects();
    }

    setupCanvas() {
        // Set canvas size to match display size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        console.log('Canvas setup - Width:', this.canvas.width, 'Height:', this.canvas.height);
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            console.log('Canvas resized - Width:', this.canvas.width, 'Height:', this.canvas.height);
        });
    }

    initGameObjects() {
        // Player
        this.player = {
            x: 100,
            y: this.canvas.height - 100,
            width: 40,
            height: 60,
            velocityY: 0,
            isJumping: false
        };

        // Ground
        this.ground = {
            y: this.canvas.height - 40,
            height: 40
        };

        // Obstacles
        this.obstacles = [];
        this.obstacleTypes = [
            { width: 50, height: 100, y: this.ground.y - 100 }, // High obstacle
            { width: 100, height: 50, y: this.ground.y - 50 }  // Low obstacle
        ];

        // Add initial obstacles
        this.addInitialObstacles();

        // Background elements - increased speed for better movement
        this.backgrounds = [
            { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, speed: 3 },
            { x: 0, y: this.ground.y - 100, width: this.canvas.width, height: 100, speed: 4 },
            { x: this.canvas.width, y: this.ground.y - 150, width: 200, height: 50, speed: 5 },
            { x: this.canvas.width + 300, y: this.ground.y - 120, width: 150, height: 70, speed: 5 }
        ];

        // Game physics
        this.gravity = 0.8;
        this.jumpPower = -15;
    }

    addInitialObstacles() {
        // Safety check for canvas width
        if (!this.canvas || !this.canvas.width || isNaN(this.canvas.width)) {
            console.error('Invalid canvas width in addInitialObstacles:', this.canvas?.width);
            return;
        }
        
        // Add 2-3 initial obstacles to start the game
        for (let i = 0; i < 3; i++) {
            const obstacleType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
            const obstacle = {
                x: this.canvas.width + (i * 300) + 100, // Space them out but closer to screen
                y: obstacleType.y,
                width: obstacleType.width,
                height: obstacleType.height
            };
            
            // Safety check for obstacle position
            if (!isNaN(obstacle.x) && !isNaN(obstacle.y)) {
                this.obstacles.push(obstacle);
                console.log(`Initial obstacle ${i + 1}:`, obstacle);
            } else {
                console.error(`Invalid initial obstacle ${i + 1}:`, obstacle);
            }
        }
        console.log('Initial obstacles added:', this.obstacles.length);
        console.log('Canvas width:', this.canvas.width);
    }

    start() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop(currentTime) {
        if (!this.gameManager.gameRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update player physics
        this.updatePlayer(deltaTime);
        
        // Update obstacles
        this.updateObstacles(deltaTime);
        
        // Update backgrounds
        this.updateBackgrounds(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Spawn new obstacles
        this.spawnObstacles();
        
        // Update game manager with safety checks
        if (this.gameManager && !isNaN(this.gameManager.gameSpeed)) {
            this.gameManager.updateDistance(this.gameManager.distance + this.gameManager.gameSpeed * (deltaTime / 1000));
        }
        
        // Debug logging every 60 frames (about once per second)
        if (Math.random() < 0.016) { // 1/60 chance
            const currentSpeed = this.gameManager && !isNaN(this.gameManager.gameSpeed) ? this.gameManager.gameSpeed : 'NaN';
            console.log('Game state - Obstacles:', this.obstacles.length, 'Speed:', currentSpeed);
        }
    }

    updatePlayer(deltaTime) {
        // Apply gravity
        if (this.player.isJumping) {
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;
            
            // Check if landed
            if (this.player.y >= this.ground.y - this.player.height) {
                this.player.y = this.ground.y - this.player.height;
                this.player.isJumping = false;
                this.player.velocityY = 0;
            }
        }
    }

    updateObstacles(deltaTime) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            // Use a fallback speed if gameManager.gameSpeed is NaN
            const currentSpeed = this.gameManager && !isNaN(this.gameManager.gameSpeed) ? this.gameManager.gameSpeed : 5;
            obstacle.x -= currentSpeed;
            
            // Debug logging for obstacle positions
            if (i === 0) { // Log first obstacle position
                console.log('First obstacle x:', obstacle.x, 'Canvas width:', this.canvas.width, 'Speed:', currentSpeed);
            }
            
            // Remove obstacles that are completely off screen (with some buffer)
            if (obstacle.x + obstacle.width < -50) {
                this.obstacles.splice(i, 1);
                this.gameManager.updateScore(10); // Bonus points for avoiding
                console.log('Obstacle removed, remaining:', this.obstacles.length);
            }
        }
    }

    updateBackgrounds(deltaTime) {
        this.backgrounds.forEach(bg => {
            bg.x -= bg.speed;
            if (bg.x + bg.width <= 0) {
                bg.x = this.canvas.width;
            }
        });
    }

    spawnObstacles() {
        // Spawn obstacles more frequently and reliably
        const minSpawnDistance = 300; // Minimum distance between obstacles
        
        // Safety check for canvas width
        if (!this.canvas || !this.canvas.width || isNaN(this.canvas.width)) {
            console.error('Invalid canvas width:', this.canvas?.width);
            return;
        }
        
        if (this.obstacles.length === 0 || 
            this.obstacles[this.obstacles.length - 1].x < this.canvas.width - minSpawnDistance) {
            
            const obstacleType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
            const obstacle = {
                x: this.canvas.width + 50, // Spawn slightly off-screen to the right
                y: obstacleType.y,
                width: obstacleType.width,
                height: obstacleType.height
            };
            
            // Safety check for obstacle position
            if (!isNaN(obstacle.x) && !isNaN(obstacle.y)) {
                this.obstacles.push(obstacle);
                
                // Debug logging
                console.log('Obstacle spawned:', obstacle);
                console.log('Total obstacles:', this.obstacles.length);
            } else {
                console.error('Invalid obstacle position:', obstacle);
            }
        }
    }

    checkCollisions() {
        const playerBounds = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };

        this.obstacles.forEach(obstacle => {
            if (this.isColliding(playerBounds, obstacle)) {
                this.gameManager.gameOver();
            }
        });
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    jump() {
        if (!this.player.isJumping) {
            this.player.isJumping = true;
            this.player.velocityY = this.jumpPower;
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw ground
        this.drawGround();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw player
        this.drawPlayer();
        
        // Debug info on screen
        this.drawDebugInfo();
    }

    drawDebugInfo() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Obstacles: ${this.obstacles.length}`, 10, 30);
        this.ctx.fillText(`Game Speed: ${this.gameManager.gameSpeed}`, 10, 50);
        this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 10, 70);
        
        if (this.obstacles.length > 0) {
            this.ctx.fillText(`First obstacle at: (${Math.round(this.obstacles[0].x)}, ${Math.round(this.obstacles[0].y)})`, 10, 90);
        }
    }

    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background elements with more visibility
        this.backgrounds.forEach((bg, index) => {
            if (index === 0) {
                // Main background layer - subtle
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            } else {
                // Additional background elements - more visible
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            }
            this.ctx.fillRect(bg.x, bg.y, bg.width, bg.height);
            
            // Add some cloud-like shapes for visual interest
            if (index >= 2) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(bg.x + bg.width/2, bg.y + bg.height/2, bg.height/3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawGround() {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, this.canvas.width, this.ground.height);
        
        // Ground texture
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.ground.y);
            this.ctx.lineTo(x, this.ground.y + this.ground.height);
            this.ctx.stroke();
        }
    }

    drawObstacles() {
        // Only log every 60 frames to avoid spam
        if (Math.random() < 0.016) {
            console.log('Drawing obstacles, count:', this.obstacles.length);
        }
        
        if (this.obstacles.length === 0) {
            console.log('No obstacles to draw!');
            return;
        }
        
        this.obstacles.forEach((obstacle, index) => {
            // Draw shadow first
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width, obstacle.height);
            
            // Main obstacle body with gradient
            const gradient = this.ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            gradient.addColorStop(0, '#FF4444');
            gradient.addColorStop(1, '#CC0000');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Obstacle outline
            this.ctx.strokeStyle = '#880000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Inner highlight
            this.ctx.strokeStyle = '#FF6666';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4);
            
            // Add obstacle number for debugging
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${index + 1}`, obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 7);
            
            // Add some texture/detail
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 8, obstacle.width - 10, 3);
        });
    }

    drawPlayer() {
        // Player body
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player outline
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player details
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.player.x + 5, this.player.y + 5, 10, 10); // Eye
        this.ctx.fillRect(this.player.x + 25, this.player.y + 5, 10, 10); // Eye
        
        // Arms and legs
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.player.x - 5, this.player.y + 10, 5, 20); // Left arm
        this.ctx.fillRect(this.player.x + this.player.width, this.player.y + 10, 5, 20); // Right arm
        this.ctx.fillRect(this.player.x + 5, this.player.y + this.player.height, 8, 15); // Left leg
        this.ctx.fillRect(this.player.x + 27, this.player.y + this.player.height, 8, 15); // Right leg
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen first
    document.getElementById('loadingScreen').classList.add('active');
    
    // Simulate loading time
    setTimeout(() => {
        const gameManager = new GameManager();
        window.gameManager = gameManager; // Make it globally accessible for debugging
    }, 1000);
});
