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
        this.player = { x: 100, y: 300, width: 40, height: 60, velocityY: 0, isJumping: false };
        this.ground = { y: 360, height: 40 };
        this.obstacles = [];
        
        // Game physics
        this.gravity = 0.8;
        this.jumpPower = -16;
        
        this.init();
    }
    
    init() {
        console.log('Initializing SimpleGame');
        this.setupCanvas();
        this.setupControls();
        this.createInitialObstacles();
    }
    
    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 400;
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
            x: 600,
            y: this.ground.y - 60,
            width: 30,
            height: 60
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
                x: this.canvas.width + 200,
                y: this.ground.y - 60,
                width: 30,
                height: 60
            };
            this.obstacles.push(newObstacle);
        }
        
        // Update game stats
        this.distance += this.gameSpeed * 0.1;
        this.score = Math.floor(this.distance);
        
        // Update UI
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('currentDistance').textContent = Math.floor(this.distance);
        
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
        // Show game over screen
        document.getElementById('gameOverScore').textContent = this.score;
        document.getElementById('gameOverDistance').textContent = Math.floor(this.distance);
        document.getElementById('gameOverScreen').classList.add('active');
        document.getElementById('gameScreen').classList.remove('active');
    }
    
    render() {
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
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${index + 1}`, obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2 + 7);
            this.ctx.fillStyle = '#FF4444';
        });
        
        // Draw player
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw debug info
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Obstacles: ${this.obstacles.length}`, 10, 30);
        this.ctx.fillText(`Game Speed: ${this.gameSpeed}`, 10, 50);
        this.ctx.fillText(`Canvas: ${this.canvas.width}x${this.canvas.height}`, 10, 70);
        this.ctx.fillText(`Jump Power: ${Math.abs(this.jumpPower)}`, 10, 110);
        this.ctx.fillText(`Player Y: ${Math.round(this.player.y)}`, 10, 130);
        
        if (this.obstacles.length > 0) {
            this.ctx.fillText(`First obstacle at: (${Math.round(this.obstacles[0].x)}, ${Math.round(this.obstacles[0].y)})`, 10, 90);
        }
        
        // Draw jump height indicator
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width/2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y - 120);
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
    // Show loading screen first
    document.getElementById('loadingScreen').classList.add('active');
    
    // Simulate loading time
    setTimeout(() => {
        const gameManager = new GameManager();
        window.gameManager = gameManager;
    }, 1000);
});
