// KeatingJaneForever - Endless Runner Game
class SimpleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameRunning = false;
        this.animationId = null;
        
        // Game state
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = 3.2; // Increased base speed for faster gameplay
        this.obstacleFrequency = 1; // Start with 1 obstacle, increases with difficulty
        
        // Game objects (positions will be updated in setupCanvas)
        this.player = { x: 150, y: 450, width: 50, height: 80, velocityY: 0, isJumping: false };
        this.ground = { y: 530, height: 70 };
        this.obstacles = [];

        // Wife character (chasing from left)
        this.wife = {
            x: 50, // Behind player on left
            y: 445, // Slightly shorter than player
            width: 45, // Slightly smaller than player
            height: 75, // Slightly shorter than player
            speed: this.gameSpeed * 0.8, // Slightly slower than game speed
            isVisible: false // Initially hidden during story
        };

        
        // Game physics
        this.gravity = 0.7; // Slightly stronger gravity to shorten airtime
        this.jumpPower = -16; // Lower jump height (less negative means lower)
        
        // Character image
        this.characterHead = new Image();
        this.characterHead.onload = () => {
            console.log('Character head image loaded successfully');
        };
        this.characterHead.onerror = () => {
            console.error('Failed to load character head image: sk-head.png');
        };
        this.characterHead.src = 'sk-head.png'; // You can change this to your image file
        
        // Obstacle image (dog)
        this.dogImage = new Image();
        this.dogImageLoaded = false;
        this.dogImage.onload = () => {
            this.dogImageLoaded = true;
            console.log('Dog obstacle image loaded successfully');
        };
        this.dogImage.onerror = () => {
            console.error('Failed to load dog image: sk_dog.png');
        };
        this.dogImage.src = 'sk_dog.png';
        
        // Story mode properties
        this.gameState = 'start'; // 'start', 'story', 'playing', 'gameOver'
        this.storyMode = false;
        this.storyLines = [
            "Meet Wong Siew Keat.",
            "A married man bound by the rules of matrimony.",
            "He slipped out without alerting his ultimate boss — his wife.",
            "Your mission: Help him escape!"
        ];
        this.currentLineIndex = 0;
        this.displayedText = "";
        this.typewriterIndex = 0;
        this.typewriterSpeed = 50; // milliseconds between characters (faster)
        this.lastTypewriterTime = 0;
        this.currentLineComplete = false; // Track if current line is fully displayed
        this.waitingForUserTap = false; // Waiting for user to tap to continue
        
        // Character transition properties
        this.isTransitioning = false;
        this.transitionStartX = 0;
        this.transitionEndX = 0;
        this.transitionProgress = 0;
        this.transitionDuration = 2000; // 2 seconds
        this.transitionStartTime = 0;
        this.instructionShown = false;
        
        // Skip button properties
        this.skipButton = {
            x: 0, y: 0, width: 0, height: 0,
            visible: false
        };
        
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
        // Get device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual canvas size (accounting for device pixel ratio)
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        
        // Set display size (CSS pixels)
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        
        // Scale the context to match device pixel ratio
        this.ctx.scale(dpr, dpr);
        
        // Store scaling info for later use
        this.canvasScale = dpr;
        this.displayWidth = window.innerWidth;
        this.displayHeight = window.innerHeight;
        
        // Update game objects positions based on screen size
        this.updateGameObjectPositions();
        
        console.log('Canvas setup - Display:', this.displayWidth + 'x' + this.displayHeight, 'Actual:', this.canvas.width + 'x' + this.canvas.height, 'DPR:', dpr);
        
        // Add resize listener to maintain fullscreen
        window.addEventListener('resize', () => {
            const newDpr = window.devicePixelRatio || 1;
            
            // Set actual canvas size (accounting for device pixel ratio)
            this.canvas.width = window.innerWidth * newDpr;
            this.canvas.height = window.innerHeight * newDpr;
            
            // Set display size (CSS pixels)
            this.canvas.style.width = window.innerWidth + 'px';
            this.canvas.style.height = window.innerHeight + 'px';
            
            // Scale the context to match device pixel ratio
            this.ctx.scale(newDpr, newDpr);
            
            // Update scaling info
            this.canvasScale = newDpr;
            this.displayWidth = window.innerWidth;
            this.displayHeight = window.innerHeight;
            
            this.updateGameObjectPositions();
        });
    }
    
    updateGameObjectPositions() {
        // Use display dimensions for positioning (not scaled canvas dimensions)
        const width = this.displayWidth || window.innerWidth;
        const height = this.displayHeight || window.innerHeight;
        
        // Make character size responsive to screen size (thinner and slightly taller)
        this.player.width = Math.max(30, Math.min(45, width * 0.04)); // Reduced width: 0.05 -> 0.04, max 60 -> 45
        this.player.height = Math.max(70, Math.min(110, height * 0.09)); // Increased height: 0.08 -> 0.09, min 60 -> 70, max 100 -> 110
        
        // Make wife size responsive (slightly smaller than player)
        this.wife.width = Math.max(35, Math.min(55, width * 0.045));
        this.wife.height = Math.max(55, Math.min(95, height * 0.075));
        
        // Position ground at bottom of screen (responsive height)
        this.ground.height = Math.max(50, height * 0.08);
        this.ground.y = height - this.ground.height;
        
        // Position player on ground
        this.player.y = this.ground.y - this.player.height;
        
        // Position wife on ground (slightly behind player)
        this.wife.y = this.ground.y - this.wife.height;
        
        // Update player x position based on game state
        if (this.storyMode) {
            // Center the character during story mode
            this.player.x = (width / 2) - (this.player.width / 2);
            // Hide wife during story mode
            this.wife.isVisible = false;
            console.log('Positioning player in center for story mode, x:', this.player.x);
        } else {
            // Normal game position (moved a bit more to the right)
            this.player.x = Math.min(200, width * 0.15);
            // Position wife behind player and make her visible (only if not already set)
            if (!this.wife.isVisible) {
                this.wife.x = Math.max(5, this.player.x - 160);
                this.wife.isVisible = true;
            }
            console.log('Positioning player on left for gameplay, x:', this.player.x);
        }
    }
    
    setupControls() {
        // Canvas click for jumping or story progression
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check if click is on skip button during story mode
            if (this.storyMode && this.skipButton.visible && 
                clickX >= this.skipButton.x && clickX <= this.skipButton.x + this.skipButton.width &&
                clickY >= this.skipButton.y && clickY <= this.skipButton.y + this.skipButton.height) {
                console.log('Skip button clicked');
                this.startActualGame();
                return;
            }
            
            if (this.storyMode) {
                // Handle story progression
                this.handleStoryTap();
            } else if (this.gameRunning) {
                // Game is running, jump
                this.jump();
            }
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Check if touch is on skip button during story mode
            if (this.storyMode && this.skipButton.visible && 
                touchX >= this.skipButton.x && touchX <= this.skipButton.x + this.skipButton.width &&
                touchY >= this.skipButton.y && touchY <= this.skipButton.y + this.skipButton.height) {
                console.log('Skip button touched');
                this.startActualGame();
                return;
            }
            
            if (this.storyMode) {
                // Handle story progression
                this.handleStoryTap();
            } else if (this.gameRunning) {
                // Game is running, jump
                this.jump();
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                        e.preventDefault();
                if (this.storyMode) {
                    // Handle story progression
                    this.handleStoryTap();
                } else if (this.gameRunning) {
                    // Game is running, jump
                    this.jump();
                }
            }
        });
    }
    
    createInitialObstacles() {
        // Create only 1 initial obstacle with random height
        const width = this.displayWidth || window.innerWidth;
        const obstacle = this.createRandomObstacle(width + 200);
        this.obstacles.push(obstacle);
        console.log('Initial obstacle created:', this.obstacles.length);
    }
    
    createRandomObstacle(x) {
        // Use display dimensions for obstacle sizing
        const screenWidth = this.displayWidth || window.innerWidth;
        const screenHeight = this.displayHeight || window.innerHeight;
        
        // Calculate maximum jump height (responsive to screen size)
        const jumpHeightRatio = Math.min(220, screenHeight * 0.3);
        const maxJumpHeight = this.ground.y - jumpHeightRatio;
        
        // Responsive obstacle dimensions
        const minHeight = Math.max(20, screenHeight * 0.03);
        const maxHeight = Math.min(Math.max(50, screenHeight * 0.08), this.ground.y - maxJumpHeight - 20);
        
        const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        // Responsive width
        const minWidth = Math.max(15, screenWidth * 0.015);
        const maxWidth = Math.max(25, screenWidth * 0.025);
        const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
        
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
        // Increase game speed every 400 distance units (faster ramp)
        const speedIncrease = Math.floor(this.distance / 400);
        this.gameSpeed = 3.2 + (speedIncrease * 0.6);
        
        // Cap maximum speed higher for more challenge
        this.gameSpeed = Math.min(this.gameSpeed, 7.5);
        
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
            
            // Play jump sound with variation
            if (window.gameManager && window.gameManager.audioManager) {
                window.gameManager.audioManager.playJumpSound();
            }
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
        
        console.log('Starting story mode');
        
        // Enter story mode first
        this.gameState = 'story';
        this.storyMode = true;
        this.gameRunning = false; // Don't start game logic yet
        this.isTransitioning = false; // Make sure we're not transitioning
        
        // Start game music during story mode for better atmosphere
        if (window.gameManager && window.gameManager.audioManager) {
            console.log('Story mode starting - switching to game music');
            window.gameManager.audioManager.stopMainMenuMusic(); // Stop menu music
            setTimeout(() => {
                console.log('Starting game music...');
                window.gameManager.audioManager.playGameMusic(); // Start game music
            }, 200);
        }
        
        // Reset story properties
        this.currentLineIndex = 0;
        this.displayedText = "";
        this.typewriterIndex = 0;
        this.lastTypewriterTime = Date.now(); // Set initial time
        this.instructionShown = false; // Reset instruction flag
        this.currentLineComplete = false;
        this.waitingForUserTap = false;
        
        console.log('Story initialized - lines:', this.storyLines.length, 'currentLine:', this.currentLineIndex);
        
        // Update positions for story mode
        this.updateGameObjectPositions();
        
        this.gameLoop();
    }
    
    startActualGame() {
        // Prevent multiple calls
        if (this.gameRunning || this.gameState === 'playing') {
            console.log('startActualGame called but already running');
            return;
        }

        console.log('Starting actual game directly');
        
        // Start game immediately
        this.gameState = 'playing';
        this.storyMode = false;
        this.gameRunning = true;
        this.isTransitioning = false;
        
        console.log('Starting actual game - setting storyMode to false and positioning player on left');
        
        // Update positions now that we're out of story mode
        this.updateGameObjectPositions();
        
        console.log('Player positioned at x:', this.player.x, 'storyMode:', this.storyMode);

        // Music is already playing from story mode, no need to start it here
    }
    
    completeTransition() {
        console.log('Transition complete - starting actual game');
        this.gameState = 'playing';
        this.storyMode = false;
        this.gameRunning = true;
        this.isTransitioning = false;
    }
    
    stop() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    gameLoop() {
        if (this.storyMode) {
            this.updateStory();
            this.renderStory();
        } else if (this.gameRunning) {
            this.update();
            this.render();
        } else {
            return;
        }

        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    updateStory() {
        const currentTime = Date.now();
        
        // Check if we have more lines to show
        if (this.currentLineIndex >= this.storyLines.length) {
            return; // All lines complete
        }
        
        const currentLine = this.storyLines[this.currentLineIndex];
        
        // If waiting for user tap, don't continue typing
        if (this.waitingForUserTap) {
            return;
        }
        
        // Handle typewriter effect for current line
        if (this.typewriterIndex < currentLine.length && 
            currentTime - this.lastTypewriterTime > this.typewriterSpeed) {
            
            this.displayedText += currentLine[this.typewriterIndex];
            this.typewriterIndex++;
            this.lastTypewriterTime = currentTime;
            
            // If current line is complete, wait for user tap
            if (this.typewriterIndex >= currentLine.length) {
                console.log(`Line ${this.currentLineIndex + 1} complete:`, currentLine);
                this.currentLineComplete = true;
                this.waitingForUserTap = true;
            }
        }
    }
    
    // Handle user tap during story
    handleStoryTap() {
        if (this.currentLineIndex >= this.storyLines.length) {
            // All lines shown, start game
            console.log('Starting game after final story tap');
            this.startActualGame();
            return;
        }
        
        const currentLine = this.storyLines[this.currentLineIndex];
        
        if (!this.currentLineComplete) {
            // Line is still typing, show full line instantly
            console.log('Completing current line instantly');
            this.displayedText = currentLine;
            this.typewriterIndex = currentLine.length;
            this.currentLineComplete = true;
            this.waitingForUserTap = true;
        } else {
            // Line is complete, move to next line
            console.log(`Moving to next line (${this.currentLineIndex + 1})`);
            this.currentLineIndex++;
            
            if (this.currentLineIndex >= this.storyLines.length) {
                // All lines complete, show instruction
                console.log('All story lines complete - ready for final tap');
                this.waitingForUserTap = true;
            } else {
                // Start typing next line
                this.displayedText = "";
                this.typewriterIndex = 0;
                this.currentLineComplete = false;
                this.waitingForUserTap = false;
                this.lastTypewriterTime = Date.now();
            }
        }
    }
    
    updateTransition() {
        const currentTime = Date.now();
        const elapsed = currentTime - this.transitionStartTime;
        
        // Calculate transition progress (0 to 1)
        this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
        
        // Use easing function for smooth transition
        const easeProgress = this.easeInOutCubic(this.transitionProgress);
        
        // Interpolate player position
        this.player.x = this.transitionStartX + (this.transitionEndX - this.transitionStartX) * easeProgress;
        
        // Check if transition is complete
        if (this.transitionProgress >= 1) {
            this.player.x = this.transitionEndX;
            this.completeTransition();
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    renderTransition() {
        // Check if canvas and context exist
        if (!this.canvas || !this.ctx) {
            console.error('Canvas or context not available');
            return;
        }
        
        // Clear canvas
        const width = this.displayWidth || window.innerWidth;
        const height = this.displayHeight || window.innerHeight;
        this.ctx.clearRect(0, 0, width, height);
        
        // Enable text antialiasing for crisp text
        this.ctx.textRenderingOptimization = 'optimizeQuality';
        this.ctx.imageSmoothingEnabled = true;
        
        // Draw sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw clouds
        this.drawClouds();
        
        // Draw trees
        this.drawTrees();
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, width, this.ground.height);
        
        // Draw character (now in running animation as it moves)
        this.drawStickman(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Add transition instruction text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Get ready to run!', width / 2, height / 4);
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
            const width = this.displayWidth || window.innerWidth;
            const newObstacle = this.createRandomObstacle(width + 300);
            this.obstacles.push(newObstacle);
        }
        
        // Update wife position (chasing behavior)
        if (this.wife.isVisible) {
            // Wife tries to catch up to player but ALWAYS stays behind
            const targetDistance = 160; // Desired distance behind player (more gap)
            const currentDistance = this.player.x - this.wife.x;
            
            if (currentDistance > targetDistance + 30) {
                // Wife is too far behind, speed up (but not too much)
                this.wife.x += this.gameSpeed * 0.95;
            } else if (currentDistance < targetDistance - 15) {
                // Wife is too close, slow down significantly
                this.wife.x += this.gameSpeed * 0.3;
            } else {
                // Maintain steady chase at slightly slower speed
                this.wife.x += this.gameSpeed * 0.8;
            }
            
            // CRITICAL: Ensure wife never gets ahead of player
            if (this.wife.x > this.player.x - 100) {
                this.wife.x = this.player.x - 100; // Force her to stay at least 100px behind
            }
            
            // Keep wife on screen (don't let her fall too far behind)
            // Ensure wife is fully visible on mobile devices
            if (this.wife.x < 0) {
                this.wife.x = 5; // Keep at least 5px from left edge
            }
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
        
        // Stop game music and play lose sound
        if (window.gameManager && window.gameManager.audioManager) {
            window.gameManager.audioManager.stopGameMusic(); // Stop game music
            window.gameManager.audioManager.playLoseSound();
        }
        
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
    
    async loadLeaderboard() {
        // Check if elements exist before trying to access them
        const leaderboardElement = document.getElementById('leaderboard');
        const playerRankElement = document.getElementById('playerRank');
        
        if (!leaderboardElement || !playerRankElement) {
            console.error('Leaderboard elements not found');
            return;
        }
        
        // Get current username
        const username = window.gameManager ? window.gameManager.username : 'Player';
        console.log('Current username:', username);
        console.log('Current game score:', this.score);
        
        try {
            // Show loading state
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Loading leaderboard...</span></div>';
            playerRankElement.textContent = '-';
            
            // Get all scores from Firebase to check user's existing scores
            const allScores = await window.FirebaseHelper.getTopScores(100);
            const userScores = allScores.filter(score => score.username === username);
            const userHighScore = userScores.length > 0 ? Math.max(...userScores.map(s => s.score)) : 0;
            
            console.log(`User's existing high score: ${userHighScore}`);
            console.log(`Current game score: ${this.score}`);
            
            // Only save if this is a new high score
            if (this.score >= userHighScore) {
                console.log('Saving new high score to Firebase');
                const browserId = window.gameManager ? window.gameManager.browserId : 'unknown';
                await window.FirebaseHelper.saveScore(username, this.score, Math.floor(this.distance), browserId);
                console.log(`Saved new high score for ${username}: ${this.score}`);
            } else {
                console.log(`Score ${this.score} not higher than existing best ${userHighScore} for ${username}`);
            }
            
            // Get top 10 scores from Firebase
            const topScores = await window.FirebaseHelper.getTopScores(10);
            console.log('Loaded top scores from Firebase:', topScores);
            
            // Get player rank
            const playerRank = await window.FirebaseHelper.getPlayerRank(this.score);
            console.log('Player rank:', playerRank);
            
            // Update UI
            playerRankElement.textContent = playerRank > 0 ? playerRank : '-';
            
            // Display leaderboard
            if (topScores.length === 0) {
                leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
            } else {
                leaderboardElement.innerHTML = topScores.map((score, index) => `
                    <div class="leaderboard-item ${score.username === username ? 'current-player' : ''}">
                        <span class="rank">${index + 1}</span>
                        <span class="username">${score.username}</span>
                        <span class="score">${score.score}</span>
                    </div>
                `).join('');
            }
            
            console.log('Leaderboard updated from Firebase');
            
        } catch (error) {
            console.error('Error loading leaderboard from Firebase:', error);
            
            // Show error message
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Error loading leaderboard</span></div>';
            playerRankElement.textContent = '-';
        }
    }
    

    
    async clearLeaderboard() {
        try {
            // Clear all leaderboard data from Firebase
            const success = await window.FirebaseHelper.clearAllScores();
            
            if (success) {
                console.log('Leaderboard completely cleared from Firebase');
                
                // Update the display to show empty leaderboard
                const leaderboardElement = document.getElementById('leaderboard');
                const playerRankElement = document.getElementById('playerRank');
                
                if (leaderboardElement) {
                    leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
                }
                
                if (playerRankElement) {
                    playerRankElement.textContent = '-';
                }
                
            } else {
                console.error('Failed to clear leaderboard');
            }
        } catch (error) {
            console.error('Error clearing leaderboard:', error);
        }
    }
    
    // Static method to clear leaderboard from anywhere
    static async clearLeaderboardGlobal() {
        try {
            // Clear all leaderboard data from Firebase
            const success = await window.FirebaseHelper.clearAllScores();
            
            if (success) {
                console.log('Leaderboard completely cleared globally from Firebase');
                
                // Update the display to show empty leaderboard
                const leaderboardElement = document.getElementById('leaderboard');
                const playerRankElement = document.getElementById('playerRank');
                
                if (leaderboardElement) {
                    leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
                }
                
                if (playerRankElement) {
                    playerRankElement.textContent = '-';
                }
            } else {
                console.error('Failed to clear leaderboard globally');
            }
        } catch (error) {
            console.error('Error clearing leaderboard globally:', error);
        }
    }
    
    renderStory() {
        // Check if canvas and context exist
        if (!this.canvas || !this.ctx) {
            console.error('Canvas or context not available');
            return;
        }
        
        // Clear canvas
        const width = this.displayWidth || window.innerWidth;
        const height = this.displayHeight || window.innerHeight;
        this.ctx.clearRect(0, 0, width, height);
        
        // Enable text antialiasing for crisp text
        this.ctx.textRenderingOptimization = 'optimizeQuality';
        this.ctx.imageSmoothingEnabled = true;
        
        // Draw sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, width, this.ground.height);
        
        // Draw character (standing still)
        this.drawStickmanStanding(this.player.x + this.player.width / 2, this.player.y, this.player.height);
        
        // Draw speech bubble with typing text
        if (this.displayedText.length > 0) {
            this.drawSpeechBubble();
        }
        
        // Add skip button (always visible) and instruction text
        this.drawSkipButton();
        
        // Show instruction text only when all lines are complete
        if (this.currentLineIndex >= this.storyLines.length) {
            const width = this.displayWidth || window.innerWidth;
            const height = this.displayHeight || window.innerHeight;
            
            this.ctx.fillStyle = '#FFFFFF';
            const instructionFontSize = Math.max(14, Math.min(24, width * 0.03));
            this.ctx.font = `${instructionFontSize}px Arial`;
            this.ctx.textAlign = 'center';
            
            // Position instruction text with better spacing from bottom
            const bottomMargin = Math.max(30, height * 0.08);
            this.ctx.fillText('Touch anywhere to start the game!', width / 2, height - bottomMargin);
        }
    }
    
    drawSkipButton() {
        const ctx = this.ctx;
        
        // Skip button dimensions (responsive and more modern)
        // Enhanced mobile responsiveness with better scaling - made smaller
        const isMobile = this.canvas.width < 768; // Detect mobile-like screen sizes
        const baseWidthRatio = isMobile ? 0.16 : 0.12; // Smaller on both mobile and desktop
        const baseHeightRatio = isMobile ? 0.06 : 0.045;
        
        const buttonWidth = Math.max(70, Math.min(110, this.canvas.width * baseWidthRatio));
        const buttonHeight = Math.max(30, Math.min(45, this.canvas.height * baseHeightRatio));
        
        // Position skip button below main character with responsive margins - positioned higher
        // Reduced margins to position button higher
        const baseMargin = Math.max(15, this.canvas.width * 0.015); // Reduced base margin
        const systemBarSafeArea = Math.max(25, this.canvas.height * 0.04); // Reduced system bar safe area
        const totalMargin = baseMargin + systemBarSafeArea;
        
        const buttonX = this.player.x + (this.player.width / 2) - (buttonWidth / 2);
        let buttonY = this.player.y + this.player.height + totalMargin;
        
        // Ensure button doesn't go below visible area (keep it within 85% of screen height)
        const maxY = this.canvas.height * 0.85 - buttonHeight;
        if (buttonY > maxY) {
            buttonY = maxY;
        }
        
        // Ensure button doesn't overlap with character (minimum distance)
        const minY = this.player.y + this.player.height + baseMargin;
        if (buttonY < minY) {
            buttonY = minY;
        }
        
        // Update skip button properties for click detection
        this.skipButton.x = buttonX;
        this.skipButton.y = buttonY;
        this.skipButton.width = buttonWidth;
        this.skipButton.height = buttonHeight;
        this.skipButton.visible = true;
        
        // Animation variables
        const time = Date.now() * 0.003;
        const pulseScale = 1 + Math.sin(time * 2) * 0.05; // Subtle pulse effect
        const glowIntensity = (Math.sin(time) + 1) * 0.5; // Glow animation
        
        // Apply scaling for pulse effect
        const scaledWidth = buttonWidth * pulseScale;
        const scaledHeight = buttonHeight * pulseScale;
        const scaledX = buttonX - (scaledWidth - buttonWidth) / 2;
        const scaledY = buttonY - (scaledHeight - buttonHeight) / 2;
        
        // Draw animated glow effect
        ctx.save();
        ctx.shadowBlur = 15 + glowIntensity * 10;
        ctx.shadowColor = `rgba(255, 107, 107, ${0.6 + glowIntensity * 0.4})`;
        
        // Draw main button background with gradient
        const gradient = ctx.createLinearGradient(scaledX, scaledY, scaledX + scaledWidth, scaledY + scaledHeight);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#ffa726');
        gradient.addColorStop(1, '#ff9800');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(scaledX, scaledY, scaledWidth, scaledHeight, scaledHeight / 2); // Rounded corners
        ctx.fill();
        
        // Draw glossy overlay effect
        const overlayGradient = ctx.createLinearGradient(scaledX, scaledY, scaledX, scaledY + scaledHeight / 2);
        overlayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        overlayGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        
        ctx.fillStyle = overlayGradient;
        ctx.beginPath();
        ctx.roundRect(scaledX, scaledY, scaledWidth, scaledHeight / 2, scaledHeight / 2);
        ctx.fill();
        
        // Draw subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(scaledX, scaledY, scaledWidth, scaledHeight, scaledHeight / 2);
        ctx.stroke();
        
        ctx.restore();
        
        // Draw button text with better styling
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        
        // Enhanced font sizing for better mobile readability - adjusted for smaller button
        const baseFontRatio = isMobile ? 0.03 : 0.022; // Slightly smaller font to match button size
        const fontSize = Math.max(12, Math.min(16, this.canvas.width * baseFontRatio));
        ctx.font = `bold ${fontSize}px Orbitron, Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw main text
        ctx.fillText('SKIP', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    drawStickmanStanding(centerX, y, height) {
        const ctx = this.ctx;
        const width = height * 0.6; // Approximate width for proportions
        
        // Draw head using image
        if (this.characterHead.complete) {
            const headSize = height * 0.8;
            ctx.drawImage(
                this.characterHead,
                centerX - headSize/2,
                y + height * 0.27 - headSize * 0.8, // Reduced gap by adjusting multiplier
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
        
        // Draw suit jacket/coat body (standing pose)
        const suitWidth = width * 0.8;
        
        // Main suit body (rounded rectangle)
        ctx.fillStyle = '#2C3E50'; // Dark blue-gray suit
        ctx.strokeStyle = '#1A252F'; // Darker outline
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(
            centerX - suitWidth/2, 
            y + height * 0.27, 
            suitWidth, 
            height * 0.48, 
            8
        );
        ctx.fill();
        ctx.stroke();
        
        // Suit lapels (V-shaped)
        ctx.fillStyle = '#34495E'; // Slightly lighter for lapels
        
        // Left lapel
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX - suitWidth/4, y + height * 0.42);
        ctx.lineTo(centerX - suitWidth/6, y + height * 0.52);
        ctx.lineTo(centerX, y + height * 0.47);
        ctx.closePath();
        ctx.fill();
        
        // Right lapel
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX + suitWidth/4, y + height * 0.42);
        ctx.lineTo(centerX + suitWidth/6, y + height * 0.52);
        ctx.lineTo(centerX, y + height * 0.47);
        ctx.closePath();
        ctx.fill();
        
        // Suit buttons (3 gold buttons)
        ctx.fillStyle = '#F39C12'; // Gold buttons
        for (let i = 0; i < 3; i++) {
            const buttonY = y + height * (0.37 + i * 0.08);
            ctx.beginPath();
            ctx.arc(centerX + suitWidth/8, buttonY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // White shirt collar/tie area
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX - suitWidth/8, y + height * 0.35);
        ctx.lineTo(centerX, y + height * 0.43);
        ctx.lineTo(centerX + suitWidth/8, y + height * 0.35);
        ctx.closePath();
        ctx.fill();
        
        // Suit pants legs (standing position) - Draw legs FIRST (behind body)
        ctx.fillStyle = '#2C3E50'; // Same suit color
        ctx.strokeStyle = '#1A252F';
        ctx.lineWidth = 1;
        
        // Left leg (positioned at left edge of body)
        ctx.beginPath();
        ctx.ellipse(centerX - suitWidth * 0.3, y + height * 0.82, 9, height * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right leg (positioned at right edge of body)
        ctx.beginPath();
        ctx.ellipse(centerX + suitWidth * 0.3, y + height * 0.82, 9, height * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Standing suit sleeves and arms (relaxed position) - Draw arms AFTER body (on top)
        ctx.fillStyle = '#2C3E50'; // Same suit color
        ctx.strokeStyle = '#1A252F';
        ctx.lineWidth = 1;
        
        // Left suit sleeve (relaxed, positioned at shoulder)
        ctx.beginPath();
        ctx.ellipse(centerX - suitWidth * 0.35, y + height * 0.45, 8, height * 0.12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right suit sleeve (relaxed, positioned at shoulder)
        ctx.beginPath();
        ctx.ellipse(centerX + suitWidth * 0.35, y + height * 0.45, 8, height * 0.12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Hands (relaxed position) - Draw LAST (on top of everything)
        ctx.fillStyle = '#FDBCB4'; // Light skin tone
        ctx.beginPath();
        ctx.arc(centerX - suitWidth * 0.45, y + height * 0.55, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + suitWidth * 0.45, y + height * 0.55, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Dress shoes (standing position) - positioned under the legs
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX - suitWidth * 0.3, y + height * 0.97, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + suitWidth * 0.3, y + height * 0.97, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSpeechBubble() {
        const ctx = this.ctx;
        const width = this.displayWidth || window.innerWidth;
        const height = this.displayHeight || window.innerHeight;
        
        // Make bubble responsive to screen size
        const bubbleWidth = Math.min(300, width * 0.8); // Max 300px or 80% of screen width
        const bubbleHeight = Math.max(60, height * 0.08); // Min 60px or 8% of screen height
        
        // Center the bubble horizontally on screen, not relative to character
        const bubbleX = (width - bubbleWidth) / 2;
        const bubbleY = Math.max(20, this.player.y - 150); // At least 20px from top
        
        const cornerRadius = 10;
        const tailSize = 20;
        
        // Draw speech bubble background
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        
        // Bubble main body
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, cornerRadius);
        ctx.fill();
        ctx.stroke();
        
        // Bubble tail (pointing to character)
        ctx.beginPath();
        ctx.moveTo(this.player.x + this.player.width / 2 - tailSize/2, bubbleY + bubbleHeight);
        ctx.lineTo(this.player.x + this.player.width / 2, bubbleY + bubbleHeight + tailSize);
        ctx.lineTo(this.player.x + this.player.width / 2 + tailSize/2, bubbleY + bubbleHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw text inside bubble with responsive font size
        ctx.fillStyle = '#000000';
        const fontSize = Math.max(12, Math.min(20, width * 0.025)); // Responsive font size
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        
        // Handle text wrapping for longer text on small screens
        const maxWidth = bubbleWidth - 20; // Leave some padding
        const words = this.displayedText.split(' ');
        let line = '';
        let y = bubbleY + bubbleHeight / 2;
        
        // Simple text wrapping
        if (ctx.measureText(this.displayedText).width <= maxWidth) {
            // Text fits in one line
            ctx.fillText(this.displayedText, bubbleX + bubbleWidth / 2, y + 5);
        } else {
            // Text needs wrapping
            const lines = [];
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                if (ctx.measureText(testLine).width > maxWidth && i > 0) {
                    lines.push(line);
                    line = words[i] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);
            
            // Draw multiple lines
            const lineHeight = fontSize + 4;
            const startY = y - (lines.length - 1) * lineHeight / 2;
            lines.forEach((textLine, index) => {
                ctx.fillText(textLine.trim(), bubbleX + bubbleWidth / 2, startY + index * lineHeight + 5);
            });
        }
    }

    render() {
        // Check if canvas and context exist
        if (!this.canvas || !this.ctx) {
            console.error('Canvas or context not available');
            return;
        }
        
        // Clear canvas
        const width = this.displayWidth || window.innerWidth;
        const height = this.displayHeight || window.innerHeight;
        this.ctx.clearRect(0, 0, width, height);
        
        // Enable text antialiasing for crisp text
        this.ctx.textRenderingOptimization = 'optimizeQuality';
        this.ctx.imageSmoothingEnabled = true;
        
        // Draw sky
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw clouds
        this.drawClouds();
        
        // Draw trees
        this.drawTrees();
        
        // Draw a test cloud and tree in top-left corner to verify drawing works
        // this.drawTestElements(); // Commented out to avoid confusion
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.ground.y, width, this.ground.height);
        
        // Draw obstacles as dog images (fallback to red rectangles if not loaded)
        this.obstacles.forEach((obstacle) => {
            if (this.dogImageLoaded) {
                this.ctx.drawImage(this.dogImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                this.ctx.fillStyle = '#FF4444';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        });
        
        // Draw player
        this.drawStickman(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw wife character (if visible)
        if (this.wife.isVisible) {
            this.drawWife(this.wife.x, this.wife.y, this.wife.width, this.wife.height);
        }

    }

    drawStickman(x, y, width, height) {
        const ctx = this.ctx;
        const centerX = x + width / 2;
        
        // Draw head using image instead of circle
        if (this.characterHead.complete) {
            const headSize = height * 0.8; // Increased from 0.24 to 0.4 to make head bigger
            
            // Add cute head shake animation while running (not while jumping)
            let headShakeX = 0;
            if (!this.player.isJumping) {
                const time = Date.now() * 0.008; // Fast shake timing
                headShakeX = Math.sin(time * 3) * 3; // Small side-to-side shake
            }
            
            ctx.drawImage(
                this.characterHead, 
                centerX - headSize/2 + headShakeX, // Add shake offset
                y + height * 0.27 - headSize * 0.8,  // Reduced gap by adjusting multiplier
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
        
        // Draw suit jacket/coat body
        const suitWidth = width * 0.8;
        
        // Main suit body (rounded rectangle)
        ctx.fillStyle = '#2C3E50'; // Dark blue-gray suit
        ctx.strokeStyle = '#1A252F'; // Darker outline
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(
            centerX - suitWidth/2, 
            y + height * 0.27, 
            suitWidth, 
            height * 0.48, 
            8
        );
        ctx.fill();
        ctx.stroke();
        
        // Suit lapels (V-shaped)
        ctx.fillStyle = '#34495E'; // Slightly lighter for lapels
        
        // Left lapel
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX - suitWidth/4, y + height * 0.42);
        ctx.lineTo(centerX - suitWidth/6, y + height * 0.52);
        ctx.lineTo(centerX, y + height * 0.47);
        ctx.closePath();
        ctx.fill();
        
        // Right lapel
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX + suitWidth/4, y + height * 0.42);
        ctx.lineTo(centerX + suitWidth/6, y + height * 0.52);
        ctx.lineTo(centerX, y + height * 0.47);
        ctx.closePath();
        ctx.fill();
        
        // Suit buttons (3 gold buttons)
        ctx.fillStyle = '#F39C12'; // Gold buttons
        for (let i = 0; i < 3; i++) {
            const buttonY = y + height * (0.37 + i * 0.08);
            ctx.beginPath();
            ctx.arc(centerX + suitWidth/8, buttonY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // White shirt collar/tie area
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(centerX, y + height * 0.27);
        ctx.lineTo(centerX - suitWidth/8, y + height * 0.35);
        ctx.lineTo(centerX, y + height * 0.43);
        ctx.lineTo(centerX + suitWidth/8, y + height * 0.35);
        ctx.closePath();
        ctx.fill();
        
        // Jumping animation with suit
        if (this.player.isJumping) {
            // Jumping pose - arms slightly up, legs together
            
            // Left suit sleeve (raised)
            ctx.fillStyle = '#2C3E50';
            ctx.strokeStyle = '#1A252F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(centerX - width * 0.15, y + height * 0.35, 8, height * 0.1, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Right suit sleeve (raised)
            ctx.beginPath();
            ctx.ellipse(centerX + width * 0.15, y + height * 0.35, 8, height * 0.1, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Hands (jumping position)
            ctx.fillStyle = '#FDBCB4';
            ctx.beginPath();
            ctx.arc(centerX - width * 0.2, y + height * 0.3, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + width * 0.2, y + height * 0.3, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Suit pants legs (together)
            ctx.fillStyle = '#2C3E50';
            ctx.strokeStyle = '#1A252F';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(centerX - 5, y + height * 0.82, 8, height * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(centerX + 5, y + height * 0.82, 8, height * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Shoes (jumping position)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(centerX - 5, y + height * 0.95, 7, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(centerX + 5, y + height * 0.95, 7, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Realistic running animation - running to the right with forward momentum
            const time = Date.now() * 0.004; // Slower animation - reduced from 0.008 to 0.004
            
            // Calculate running cycle (0 to 2π)
            const cycle = (time * 2) % (Math.PI * 2);
            
            // Body bounce (up and down movement)
            const bodyBounce = Math.sin(cycle * 2) * 0.02;
            
            // Hip rotation (side to side movement) and forward lean
            const hipRotation = Math.sin(cycle * 2) * 0.03;
            const forwardLean = 0.05; // Slight forward lean for running momentum
            
            // Arm swing calculations - running left to right with forward momentum
            const leftArmAngle = Math.sin(cycle * 2) * 0.6; // Left arm swings forward/back
            const rightArmAngle = Math.sin(cycle * 2 + Math.PI) * 0.6; // Right arm opposite
            
            // Leg movement calculations - running left to right with forward stride
            const leftLegAngle = Math.sin(cycle * 2 + Math.PI) * 0.7; // Left leg opposite to right
            const rightLegAngle = Math.sin(cycle * 2) * 0.7; // Right leg forward stride
            
            // Apply body bounce to all positions
            const bounceOffset = height * bodyBounce;
            const hipOffset = width * hipRotation;
            
            // Calculate shoulder and hip positions (at edges of body) with forward lean
            const leftShoulderX = centerX + hipOffset - suitWidth * 0.35 + width * forwardLean;
            const rightShoulderX = centerX + hipOffset + suitWidth * 0.35 + width * forwardLean;
            const shoulderY = y + height * 0.4 + bounceOffset;
            
            const leftHipX = centerX + hipOffset - suitWidth * 0.3 + width * forwardLean * 0.5;
            const rightHipX = centerX + hipOffset + suitWidth * 0.3 + width * forwardLean * 0.5;
            const hipY = y + height * 0.75 + bounceOffset;
            
            // Calculate limb end positions for left-to-right running
            // Arms: swing forward and backward with more horizontal movement
            const leftArmEndX = leftShoulderX + width * (0.1 + leftArmAngle * 0.4); // Forward/back swing
            const leftArmEndY = shoulderY + height * (0.15 - Math.abs(leftArmAngle) * 0.2); // Slight up/down
            const rightArmEndX = rightShoulderX + width * (0.1 + rightArmAngle * 0.4); // Forward/back swing
            const rightArmEndY = shoulderY + height * (0.15 - Math.abs(rightArmAngle) * 0.2); // Slight up/down
            
            // Legs: stride forward and backward with more pronounced movement
            const leftLegEndX = leftHipX + width * (0.2 + leftLegAngle * 0.5); // Forward stride
            const leftLegEndY = hipY + height * (0.25 - Math.abs(leftLegAngle) * 0.15); // Lift during stride
            const rightLegEndX = rightHipX + width * (0.2 + rightLegAngle * 0.5); // Forward stride
            const rightLegEndY = hipY + height * (0.25 - Math.abs(rightLegAngle) * 0.15); // Lift during stride
            
            // Draw suit pants legs FIRST (behind body)
            ctx.fillStyle = '#2C3E50'; // Same suit color
            ctx.strokeStyle = '#1A252F';
            ctx.lineWidth = 1;
            
            // Left suit pants leg
            ctx.beginPath();
            ctx.ellipse(
                (leftHipX + leftLegEndX) / 2,
                (hipY + leftLegEndY) / 2,
                9, height * 0.18,
                Math.atan2(leftLegEndY - hipY, leftLegEndX - leftHipX),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
            
            // Right suit pants leg
            ctx.beginPath();
            ctx.ellipse(
                (rightHipX + rightLegEndX) / 2,
                (hipY + rightLegEndY) / 2,
                9, height * 0.18,
                Math.atan2(rightLegEndY - hipY, rightLegEndX - rightHipX),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
            
            // Draw suit sleeves and arms ON TOP of body
            ctx.fillStyle = '#2C3E50'; // Same suit color
            ctx.strokeStyle = '#1A252F';
            ctx.lineWidth = 1;
            
            // Left suit sleeve
            ctx.beginPath();
            ctx.ellipse(
                (leftShoulderX + leftArmEndX) / 2,
                (shoulderY + leftArmEndY) / 2,
                8, height * 0.12,
                Math.atan2(leftArmEndY - shoulderY, leftArmEndX - leftShoulderX),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
            
            // Right suit sleeve
            ctx.beginPath();
            ctx.ellipse(
                (rightShoulderX + rightArmEndX) / 2,
                (shoulderY + rightArmEndY) / 2,
                8, height * 0.12,
                Math.atan2(rightArmEndY - shoulderY, rightArmEndX - rightShoulderX),
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
            
            // Hands (skin color) - Draw LAST (on top of everything)
            ctx.fillStyle = '#FDBCB4'; // Light skin tone
            ctx.beginPath();
            ctx.arc(leftArmEndX, leftArmEndY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightArmEndX, rightArmEndY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Dress shoes (black) - positioned at leg ends
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(leftLegEndX, leftLegEndY - 2, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(rightLegEndX, rightLegEndY - 2, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Remove eyes and smile since we're using an image for the head
        // The image should have the face details already
    }

    drawWife(x, y, width, height) {
        const ctx = this.ctx;
        const centerX = x + width / 2;
        
        // Draw wife's head (circular with hair)
        ctx.fillStyle = '#8B4513'; // Brown hair
        ctx.beginPath();
        ctx.arc(centerX, y + height * 0.15, height * 0.14, 0, Math.PI * 2); // Hair (slightly bigger)
        ctx.fill();
        
        // Face
        ctx.fillStyle = '#FDBCB4'; // Light skin tone
        ctx.beginPath();
        ctx.arc(centerX, y + height * 0.15, height * 0.11, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair style (ponytail)
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(centerX + width * 0.2, y + height * 0.15, width * 0.1, height * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Simple facial features
        ctx.fillStyle = '#000000';
        // Eyes
        ctx.beginPath();
        ctx.arc(centerX - width * 0.05, y + height * 0.12, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + width * 0.05, y + height * 0.12, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw dress/blouse body
        const dressWidth = width * 0.9;
        
        // Main dress body (A-line shape)
        ctx.fillStyle = '#FF69B4'; // Pink dress
        ctx.strokeStyle = '#E91E63'; // Darker pink outline
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        // Create A-line dress shape
        ctx.moveTo(centerX - dressWidth * 0.3, y + height * 0.27); // Top left
        ctx.lineTo(centerX + dressWidth * 0.3, y + height * 0.27); // Top right
        ctx.lineTo(centerX + dressWidth * 0.45, y + height * 0.7); // Bottom right (wider)
        ctx.lineTo(centerX - dressWidth * 0.45, y + height * 0.7); // Bottom left (wider)
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Running animation for wife
        const time = Date.now() * 0.005; // Slightly different timing than husband
        const cycle = (time * 2) % (Math.PI * 2);
        
        // Body bounce
        const bodyBounce = Math.sin(cycle * 2) * 0.015;
        const bounceOffset = height * bodyBounce;
        
        // Improved chasing arm animation - more natural reaching motion
        const leftArmSwing = Math.sin(cycle * 2) * 0.3; // Left arm swings
        const rightArmSwing = Math.sin(cycle * 2 + Math.PI) * 0.3; // Right arm opposite
        const baseReach = 0.6; // Base forward reach
        
        // Leg movement (under dress)
        const leftLegAngle = Math.sin(cycle * 2 + Math.PI) * 0.4;
        const rightLegAngle = Math.sin(cycle * 2) * 0.4;
        
        // Calculate arm positions - natural chasing motion
        const leftShoulderX = centerX - dressWidth * 0.25;
        const rightShoulderX = centerX + dressWidth * 0.25;
        const shoulderY = y + height * 0.35 + bounceOffset;
        
        // Natural running arms but both reaching forward
        const leftArmEndX = leftShoulderX + width * (baseReach + leftArmSwing * 0.3);
        const leftArmEndY = shoulderY + height * (0.1 - leftArmSwing * 0.15); // Natural swing
        const rightArmEndX = rightShoulderX + width * (baseReach + rightArmSwing * 0.3);
        const rightArmEndY = shoulderY + height * (0.1 - rightArmSwing * 0.15); // Natural swing
        
        // Draw arms as rectangles (skin color)
        ctx.fillStyle = '#FDBCB4';
        ctx.strokeStyle = '#E8A589';
        ctx.lineWidth = 1;
        
        // Left arm (rectangular)
        const leftArmWidth = 8;
        const leftArmLength = Math.sqrt(Math.pow(leftArmEndX - leftShoulderX, 2) + Math.pow(leftArmEndY - shoulderY, 2));
        const leftArmAngle = Math.atan2(leftArmEndY - shoulderY, leftArmEndX - leftShoulderX);
        
        ctx.save();
        ctx.translate(leftShoulderX, shoulderY);
        ctx.rotate(leftArmAngle);
        ctx.fillRect(0, -leftArmWidth/2, leftArmLength, leftArmWidth);
        ctx.strokeRect(0, -leftArmWidth/2, leftArmLength, leftArmWidth);
        ctx.restore();
        
        // Right arm (rectangular)
        const rightArmWidth = 8;
        const rightArmLength = Math.sqrt(Math.pow(rightArmEndX - rightShoulderX, 2) + Math.pow(rightArmEndY - shoulderY, 2));
        const rightArmAngle = Math.atan2(rightArmEndY - shoulderY, rightArmEndX - rightShoulderX);
        
        ctx.save();
        ctx.translate(rightShoulderX, shoulderY);
        ctx.rotate(rightArmAngle);
        ctx.fillRect(0, -rightArmWidth/2, rightArmLength, rightArmWidth);
        ctx.strokeRect(0, -rightArmWidth/2, rightArmLength, rightArmWidth);
        ctx.restore();
        
        // Hands
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(leftArmEndX, leftArmEndY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightArmEndX, rightArmEndY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Legs (visible under dress hem)
        const leftLegX = centerX - width * 0.15 + width * leftLegAngle * 0.2;
        const rightLegX = centerX + width * 0.15 + width * rightLegAngle * 0.2;
        const legY = y + height * 0.7 + bounceOffset;
        const legEndY = y + height * 0.95 + bounceOffset;
        
        // Left leg
        ctx.fillStyle = '#FDBCB4'; // Skin color
        ctx.strokeStyle = '#E8A589';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(
            leftLegX,
            (legY + legEndY) / 2,
            4, height * 0.12,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        
        // Right leg
        ctx.beginPath();
        ctx.ellipse(
            rightLegX,
            (legY + legEndY) / 2,
            4, height * 0.12,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        
        // Shoes (high heels)
        ctx.fillStyle = '#8B0000'; // Dark red shoes
        ctx.beginPath();
        ctx.ellipse(leftLegX, legEndY - 2, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLegX, legEndY - 2, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawClouds() {
        const ctx = this.ctx;
        const time = Date.now() * 0.001; // Slow cloud movement
        
        // Initialize cloud positions if not already done
        if (!this.cloudPositions) {
            this.cloudPositions = [
                { x: 1300, y: 80, size: 80, currentX: 1300 },   // Cloud 1
                { x: 1700, y: 120, size: 100, currentX: 1700 }, // Cloud 2
                { x: 2100, y: 60, size: 90, currentX: 2100 }    // Cloud 3
            ];
        }
        
        this.cloudPositions.forEach((cloud, index) => {
            // Update current position - move from right to left
            cloud.currentX -= 0.3; // Same speed as trees
            
            // If cloud goes off the left side, wrap it to the right side
            if (cloud.currentX < -cloud.size) {
                cloud.currentX = this.canvas.width + cloud.size + Math.random() * 200; // Add some randomness
            }
            
            // Only draw if cloud is visible on screen
            if (cloud.currentX > -cloud.size && cloud.currentX < this.canvas.width + cloud.size) {
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.85; // Slightly transparent for natural look
                
                // Draw fluffy cloud using multiple overlapping circles
                ctx.beginPath();
                
                // Main cloud body (bottom row of circles)
                ctx.arc(cloud.currentX, cloud.y, cloud.size * 0.35, 0, Math.PI * 2);
                ctx.arc(cloud.currentX + cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
                ctx.arc(cloud.currentX + cloud.size * 0.8, cloud.y, cloud.size * 0.3, 0, Math.PI * 2);
                ctx.arc(cloud.currentX + cloud.size * 1.1, cloud.y, cloud.size * 0.25, 0, Math.PI * 2);
                
                // Top puffs (upper row of circles)
                ctx.arc(cloud.currentX + cloud.size * 0.2, cloud.y - cloud.size * 0.25, cloud.size * 0.3, 0, Math.PI * 2);
                ctx.arc(cloud.currentX + cloud.size * 0.6, cloud.y - cloud.size * 0.3, cloud.size * 0.35, 0, Math.PI * 2);
                ctx.arc(cloud.currentX + cloud.size * 0.9, cloud.y - cloud.size * 0.2, cloud.size * 0.25, 0, Math.PI * 2);
                
                // Extra small puffs for detail
                ctx.arc(cloud.currentX + cloud.size * 0.1, cloud.y - cloud.size * 0.1, cloud.size * 0.2, 0, Math.PI * 2);
                ctx.arc(cloud.currentX + cloud.size * 1.0, cloud.y - cloud.size * 0.05, cloud.size * 0.18, 0, Math.PI * 2);
                
                ctx.fill();
                ctx.closePath();
                
                // Add subtle shadow/depth with light gray outline
                ctx.strokeStyle = '#E0E0E0';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
        
        ctx.globalAlpha = 1.0; // Reset transparency
    }
    
    drawTrees() {
        const ctx = this.ctx;
        const time = Date.now() * 0.002; // Very slow tree movement for parallax effect
        
        // Initialize tree positions if not already done
        if (!this.treePositions) {
            this.treePositions = [
                { x: 1400, y: this.ground.y - 80, size: 120, currentX: 1400 },  // Tree 1
                { x: 2000, y: this.ground.y - 100, size: 140, currentX: 2000 }, // Tree 2
                { x: 2600, y: this.ground.y - 90, size: 130, currentX: 2600 }   // Tree 3
            ];
        }
        
        this.treePositions.forEach((tree, index) => {
            // Update current position - move from right to left (parallax effect)
            tree.currentX -= 0.3; // Increased movement speed for better visibility
            
            // If tree goes off the left side, wrap it to the right side
            if (tree.currentX < -tree.size) {
                tree.currentX = this.canvas.width + tree.size + Math.random() * 300; // Add some randomness
            }
            
            // Only draw if tree is visible on screen
            if (tree.currentX > -tree.size && tree.currentX < this.canvas.width + tree.size) {
                // Draw tree trunk - positioned on the ground
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(tree.currentX - 12, this.ground.y - 60, 24, 60); // Trunk starts from ground, shorter height
                
                // Add trunk outline
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(tree.currentX - 12, this.ground.y - 60, 24, 60);
                
                // Draw tree leaves (multiple circles for foliage) - positioned above trunk
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(tree.currentX, this.ground.y - 85, tree.size * 0.4, 0, Math.PI * 2);
                ctx.arc(tree.currentX - tree.size * 0.3, this.ground.y - 110, tree.size * 0.35, 0, Math.PI * 2);
                ctx.arc(tree.currentX + tree.size * 0.3, this.ground.y - 105, tree.size * 0.3, 0, Math.PI * 2);
                ctx.arc(tree.currentX, this.ground.y - 135, tree.size * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
                
                // Add some darker green for depth
                ctx.fillStyle = '#006400';
                ctx.beginPath();
                ctx.arc(tree.currentX - tree.size * 0.2, this.ground.y - 100, tree.size * 0.2, 0, Math.PI * 2);
                ctx.arc(tree.currentX + tree.size * 0.2, this.ground.y - 120, tree.size * 0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
                
                // Add tree outline for better visibility
                ctx.strokeStyle = '#0B4F0B';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    }

    drawTestElements() {
        const ctx = this.ctx;
        const time = Date.now() * 0.001; // Slow movement for test elements

        // Test cloud - make it more visible
        const testCloudX = 50 + Math.sin(time * 2) * 20; // Oscillate around x=50
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(testCloudX, 100, 60, 0, Math.PI * 2);
        ctx.arc(testCloudX + 80, 100, 80, 0, Math.PI * 2);
        ctx.arc(testCloudX + 160, 100, 60, 0, Math.PI * 2);
        ctx.arc(testCloudX + 120, 50, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Test tree - make it more visible
        const testTreeX = 200 + Math.sin(time * 1.5) * 15; // Oscillate around x=200
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(testTreeX - 15, this.ground.y - 60, 30, 60); // Tree trunk on ground, shorter height

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(testTreeX - 15, this.ground.y - 60, 30, 60);

        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(testTreeX, this.ground.y - 85, 60, 0, Math.PI * 2);
        ctx.arc(testTreeX - 60, this.ground.y - 105, 60, 0, Math.PI * 2);
        ctx.arc(testTreeX + 60, this.ground.y - 105, 60, 0, Math.PI * 2);
        ctx.arc(testTreeX, this.ground.y - 125, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(testTreeX - 40, this.ground.y - 105, 40, 0, Math.PI * 2);
        ctx.arc(testTreeX + 40, this.ground.y - 105, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.strokeStyle = '#0B4F0B';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Reset transparency
        ctx.globalAlpha = 1.0;
    }
}

// Advanced Audio Manager
class AudioManager {
    constructor() {
        this.sounds = {};
        this.soundPools = {};
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.isMuted = false;
        this.isInitialized = false;
        this.isPaused = false; // Track if music is paused due to tab visibility
        this.isPausedDueToVisibility = false; // Track if music is intentionally paused due to tab being hidden
        this.currentMusicTime = 0; // Store current playback position
        this.currentMusicAudio = null; // Reference to currently playing music
        this.musicShouldBePlaying = false; // Track if music should be playing
        this.currentGameMusicTime = 0; // Store current game music playback position
        this.currentGameMusicAudio = null; // Reference to currently playing game music
        this.gameMusicShouldBePlaying = false; // Track if game music should be playing
        
        this.init();
        this.setupVisibilityHandling();
    }
    
    init() {
        // Initialize sound pools for different sound types
        this.initializeSoundPools();
        this.loadSounds();
    }
    
    initializeSoundPools() {
        // Create pools for frequently used sounds
        this.soundPools = {
            jump: [],
            obstacle: [],
            gameOver: [],
            powerUp: [],
            music: [],
            gameMusic: []
        };
    }
    
    async loadSounds() {
        try {
            // Jump sound (single file)
            await this.loadSound('jump_2', 'jump_2.mp3', 'jump');
            
            // Game over sound
            await this.loadSound('lose', 'lose.mp3', 'gameOver');
            
            // Background music
            await this.loadSound('main_menu', 'main_menu.mp3', 'music');
            
            // Game music (plays during gameplay)
            await this.loadSound('game_music', 'game_music.mp3', 'gameMusic');
            
            // You can add more sounds later:
            // await this.loadSound('obstacle_hit', 'obstacle.mp3', 'obstacle');
            
            this.isInitialized = true;
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Some audio files could not be loaded:', error);
            this.isInitialized = false;
        }
    }
    
    async loadSound(name, filename, poolType = null) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = {
                    audio: audio,
                    filename: filename,
                    poolType: poolType,
                    isLoaded: true
                };
                
                // Create sound pool instances for frequently used sounds
                if (poolType && this.soundPools[poolType]) {
                    for (let i = 0; i < 3; i++) { // Create 3 instances for pooling
                        const poolAudio = new Audio();
                        poolAudio.src = filename;
                        poolAudio.preload = 'auto';
                        poolAudio.volume = this.sfxVolume * this.masterVolume;
                        this.soundPools[poolType].push(poolAudio);
                    }
                }
                
                resolve();
            });
            
            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load audio: ${filename}`, e);
                this.sounds[name] = {
                    audio: null,
                    filename: filename,
                    poolType: poolType,
                    isLoaded: false
                };
                resolve(); // Don't reject, just continue without this sound
            });
            
            audio.src = filename;
            audio.volume = this.sfxVolume * this.masterVolume;
        });
    }
    
    playSound(soundName, options = {}) {
        if (this.isMuted || !this.isInitialized) return;
        
        const sound = this.sounds[soundName];
        if (!sound || !sound.isLoaded) {
            console.warn(`Sound "${soundName}" not found or not loaded`);
            return;
        }
        
        const volume = options.volume !== undefined ? options.volume : this.sfxVolume;
        const pitch = options.pitch || 1.0;
        const loop = options.loop || false;
        
        try {
            // Use sound pool if available for better performance
            if (sound.poolType && this.soundPools[sound.poolType]) {
                const pooledSound = this.getAvailablePooledSound(sound.poolType);
                if (pooledSound) {
                    pooledSound.volume = volume * this.masterVolume;
                    pooledSound.playbackRate = pitch;
                    pooledSound.loop = loop;
                    pooledSound.currentTime = 0;
                    pooledSound.play().catch(e => console.warn('Audio play failed:', e));
                    return;
                }
            }
            
            // Fallback to original sound
            const audio = sound.audio.cloneNode();
            audio.volume = volume * this.masterVolume;
            audio.playbackRate = pitch;
            audio.loop = loop;
            audio.play().catch(e => console.warn('Audio play failed:', e));
            
        } catch (error) {
            console.warn(`Error playing sound "${soundName}":`, error);
        }
    }
    
    getAvailablePooledSound(poolType) {
        const pool = this.soundPools[poolType];
        if (!pool) return null;
        
        // Find an available (not playing) sound in the pool
        for (let audio of pool) {
            if (audio.paused || audio.ended) {
                return audio;
            }
        }
        
        // If all are playing, return the first one (will interrupt)
        return pool[0];
    }
    
    playJumpSound() {
        // Use single jump sound with pitch variation for variety
        const pitchVariation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
        
        this.playSound('jump_2', {
            volume: this.sfxVolume,
            pitch: pitchVariation
        });
    }
    
    playLoseSound() {
        // Play game over sound with full volume
        this.playSound('lose', {
            volume: this.sfxVolume * 1.2, // Slightly louder for impact
            pitch: 1.0 // No pitch variation for lose sound
        });
    }
    
    playMainMenuMusic() {
        if (this.isMuted || !this.isInitialized) return;
        
        // Don't start new music if already playing
        if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
            return;
        }
        
        const sound = this.sounds['main_menu'];
        if (!sound || !sound.isLoaded) {
            console.warn('Main menu music not found or not loaded');
            return;
        }
        
        try {
            // Use pooled sound if available
            if (sound.poolType && this.soundPools[sound.poolType]) {
                const pooledSound = this.getAvailablePooledSound(sound.poolType);
                if (pooledSound) {
                    this.currentMusicAudio = pooledSound;
                    pooledSound.volume = this.musicVolume * this.masterVolume;
                    pooledSound.loop = true;
                    pooledSound.currentTime = this.currentMusicTime;
                    pooledSound.play().catch(e => console.warn('Music play failed:', e));
                    this.musicShouldBePlaying = true;
                    return;
                }
            }
            
            // Fallback to original sound
            const audio = sound.audio.cloneNode();
            this.currentMusicAudio = audio;
            audio.volume = this.musicVolume * this.masterVolume;
            audio.loop = true;
            audio.currentTime = this.currentMusicTime;
            audio.play().catch(e => console.warn('Music play failed:', e));
            this.musicShouldBePlaying = true;
            
        } catch (error) {
            console.warn('Error playing main menu music:', error);
        }
    }
    
    playGameMusic() {
        if (this.isMuted || !this.isInitialized) return;
        
        // Don't start new music if already playing
        if (this.currentGameMusicAudio && !this.currentGameMusicAudio.paused) {
            return;
        }
        
        const sound = this.sounds['game_music'];
        if (!sound || !sound.isLoaded) {
            console.warn('Game music not found or not loaded');
            return;
        }
        
        try {
            // Use pooled sound if available
            if (sound.poolType && this.soundPools[sound.poolType]) {
                const pooledSound = this.getAvailablePooledSound(sound.poolType);
                if (pooledSound) {
                    this.currentGameMusicAudio = pooledSound;
                    pooledSound.volume = this.musicVolume * this.masterVolume;
                    pooledSound.loop = true;
                    pooledSound.currentTime = this.currentGameMusicTime;
                    pooledSound.play().catch(e => console.warn('Game music play failed:', e));
                    this.gameMusicShouldBePlaying = true;
                    console.log('Game music started');
                    return;
                }
            }
            
            // Fallback to original sound
            const audio = sound.audio.cloneNode();
            this.currentGameMusicAudio = audio;
            audio.volume = this.musicVolume * this.masterVolume;
            audio.loop = true;
            audio.currentTime = this.currentGameMusicTime;
            audio.play().catch(e => console.warn('Game music play failed:', e));
            this.gameMusicShouldBePlaying = true;
            console.log('Game music started');
            
        } catch (error) {
            console.warn('Error playing game music:', error);
        }
    }
    
    stopMainMenuMusic() {
        // Save current playback time if music is playing
        if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
            this.currentMusicTime = this.currentMusicAudio.currentTime;
        }
        
        // Stop only main menu music sounds (not game music)
        if (this.soundPools.music) {
            for (let audio of this.soundPools.music) {
                // Only pause if this is actually the main menu music playing
                if (this.currentMusicAudio === audio) {
                    audio.pause();
                }
            }
        }
        
        // Also stop the original main menu sound if it's playing
        const mainMenuSound = this.sounds['main_menu'];
        if (mainMenuSound && mainMenuSound.audio && this.currentMusicAudio === mainMenuSound.audio) {
            mainMenuSound.audio.pause();
        }
        
        // Clear current music reference
        this.currentMusicAudio = null;
        this.musicShouldBePlaying = false;
    }
    
    stopGameMusic() {
        // Save current playback time if game music is playing
        if (this.currentGameMusicAudio && !this.currentGameMusicAudio.paused) {
            this.currentGameMusicTime = this.currentGameMusicAudio.currentTime;
        }
        
        // Stop game music from the gameMusic pool
        if (this.soundPools.gameMusic) {
            for (let audio of this.soundPools.gameMusic) {
                audio.pause();
            }
        }
        
        // Also stop the original game music sound if it's playing
        const gameMusicSound = this.sounds['game_music'];
        if (gameMusicSound && gameMusicSound.audio) {
            gameMusicSound.audio.pause();
        }
        
        // Clear current game music reference
        this.currentGameMusicAudio = null;
        this.gameMusicShouldBePlaying = false;
        console.log('Game music stopped');
    }
    
    // Track current music state
    isMainMenuMusicPlaying() {
        return this.currentMusicAudio && !this.currentMusicAudio.paused;
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }
    
    updateAllVolumes() {
        // Update volumes for all pooled sounds
        for (let poolType in this.soundPools) {
            for (let audio of this.soundPools[poolType]) {
                if (poolType === 'music' || poolType === 'gameMusic') {
                    audio.volume = this.musicVolume * this.masterVolume;
                } else {
                    audio.volume = this.sfxVolume * this.masterVolume;
                }
            }
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAllSounds();
        }
        return this.isMuted;
    }
    
    mute() {
        this.isMuted = true;
        this.stopAllSounds();
    }
    
    unmute() {
        this.isMuted = false;
    }
    
    stopAllSounds() {
        // Stop all pooled sounds
        for (let poolType in this.soundPools) {
            for (let audio of this.soundPools[poolType]) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
        
        // Stop game music
        this.stopGameMusic();
        this.currentGameMusicTime = 0; // Reset game music time when muting
    }
    
    // Setup browser visibility handling
    setupVisibilityHandling() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab is not visible, pause music
                this.pauseMusic();
            } else {
                // Tab is visible again, resume music if appropriate
                this.resumeMusic();
            }
        });
        
        // Handle window focus/blur as backup
        window.addEventListener('blur', () => {
            this.pauseMusic();
        });
        
        window.addEventListener('focus', () => {
            this.resumeMusic();
        });
    }
    
    pauseMusic() {
        // Set flag to indicate music is intentionally paused due to tab visibility
        this.isPausedDueToVisibility = true;
        
        if (this.isMainMenuMusicPlaying() && this.musicShouldBePlaying) {
            // Save current time before pausing
            this.currentMusicTime = this.currentMusicAudio.currentTime;
            this.currentMusicAudio.pause();
            this.isPaused = true;
            console.log('Music paused at time:', this.currentMusicTime);
        }
        
        // Also pause game music if playing
        if (this.currentGameMusicAudio && !this.currentGameMusicAudio.paused && this.gameMusicShouldBePlaying) {
            this.currentGameMusicTime = this.currentGameMusicAudio.currentTime;
            this.currentGameMusicAudio.pause();
            console.log('Game music paused at time:', this.currentGameMusicTime);
        }
    }
    
    resumeMusic() {
        // Clear the visibility pause flag
        this.isPausedDueToVisibility = false;
        
        // Only resume if music was paused due to visibility and should be playing
        if (this.isPaused && this.musicShouldBePlaying && window.gameManager) {
            const currentScreen = window.gameManager.currentScreen;
            if (currentScreen === 'start' || currentScreen === 'leaderboard') {
                // Resume immediately without delay for smoother experience
                console.log('Resuming music from time:', this.currentMusicTime);
                this.playMainMenuMusic();
                this.isPaused = false;
            } else {
                this.isPaused = false;
            }
        }
        
        // Also resume game music if it should be playing
        if (this.gameMusicShouldBePlaying && window.gameManager) {
            const currentScreen = window.gameManager.currentScreen;
            if (currentScreen === 'game') {
                // Resume immediately without delay for smoother experience
                console.log('Resuming game music from time:', this.currentGameMusicTime);
                this.playGameMusic();
            }
        }
    }

    // Preload audio on user interaction (required by browsers)
    enableAudio() {
        if (!this.isInitialized) {
            console.warn('Audio system not initialized yet');
            return;
        }
        
        console.log('Enabling audio context...');
        
        // Play and immediately pause a silent sound to enable audio context
        for (let poolType in this.soundPools) {
            if (this.soundPools[poolType].length > 0) {
                const audio = this.soundPools[poolType][0];
                const originalVolume = audio.volume;
                audio.volume = 0;
                
                audio.play().then(() => {
                    audio.pause();
                    audio.volume = originalVolume;
                    console.log('Audio context enabled successfully');
                    
                    // Don't auto-start music here - let the global handler do it
                    // This prevents double music starting
                }).catch((error) => {
                    console.warn('Failed to enable audio context:', error);
                    audio.volume = originalVolume;
                });
                break;
            }
        }
    }
}

// Game Manager
class GameManager {
    constructor() {
        this.currentScreen = 'start';
        this.username = '';
        this.gameRunning = false;
        this.game = null;
        this.browserId = null;
        this.audioManager = new AudioManager();
        
        this.init();
    }
    


    // Generate a simple browser fingerprint
    generateBrowserId() {
        // Check if we already have a browser ID stored
        let browserId = localStorage.getItem('browserFingerprint');
        
        if (!browserId) {
            // Generate a simple fingerprint based on browser characteristics
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Browser fingerprint', 2, 2);
            
            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvas.toDataURL(),
                Date.now() + Math.random() // Add randomness for uniqueness
            ].join('|');
            
            // Create a simple hash
            let hash = 0;
            for (let i = 0; i < fingerprint.length; i++) {
                const char = fingerprint.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            
            browserId = 'browser_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
            
            // Store it in localStorage
            localStorage.setItem('browserFingerprint', browserId);
            console.log('Generated new browser ID:', browserId);
        } else {
            console.log('Using existing browser ID:', browserId);
        }
        
        return browserId;
    }
    
    init() {
        // Generate or retrieve browser ID
        this.browserId = this.generateBrowserId();
        
        this.setupEventListeners();
        this.setupGlobalAudioEnablement();
        this.showScreen('start');
        
        // Start main menu music after a short delay to ensure audio is ready
        setTimeout(() => {
            if (this.currentScreen === 'start') {
                this.audioManager.playMainMenuMusic();
            }
        }, 1000);
        
        // Set up periodic check to ensure music is playing when it should be
        setInterval(() => {
            this.ensureMainMenuMusicPlaying();
        }, 3000); // Check every 3 seconds
    }
    
    setupGlobalAudioEnablement() {
        // Track if audio has been successfully enabled
        this.audioEnabled = false;
        
        // Enable audio on any user interaction anywhere on the page
        const enableAudioOnInteraction = () => {
            console.log('User interaction detected, attempting to enable audio...');
            this.audioManager.enableAudio();
            
            // Check if music should be playing and start it if needed
            if (this.currentScreen === 'start' || this.currentScreen === 'leaderboard') {
                setTimeout(() => {
                    if (!this.audioManager.isMainMenuMusicPlaying() && !this.audioManager.isMuted) {
                        console.log('Starting main menu music after user interaction');
                        this.audioManager.playMainMenuMusic();
                    }
                }, 200);
            }
            
            // Only remove listeners after successful audio enablement
            setTimeout(() => {
                if (this.audioManager.isInitialized) {
                    this.audioEnabled = true;
                    document.removeEventListener('click', enableAudioOnInteraction);
                    document.removeEventListener('touchstart', enableAudioOnInteraction);
                    document.removeEventListener('keydown', enableAudioOnInteraction);
                    console.log('Global audio listeners removed - audio enabled successfully');
                }
            }, 500);
        };
        
        // Add global event listeners for any user interaction
        document.addEventListener('click', enableAudioOnInteraction, { passive: true });
        document.addEventListener('touchstart', enableAudioOnInteraction, { passive: true });
        document.addEventListener('keydown', enableAudioOnInteraction, { passive: true });
        
        console.log('Global audio enablement listeners added');
    }
    
    // Ensure music is playing when it should be
    ensureMainMenuMusicPlaying() {
        // Don't restart music if tab is hidden or music is intentionally paused due to visibility
        if (document.hidden || this.audioManager.isPausedDueToVisibility) {
            return;
        }
        
        if ((this.currentScreen === 'start' || this.currentScreen === 'leaderboard') && 
            !this.audioManager.isMainMenuMusicPlaying() && 
            !this.audioManager.isMuted && 
            this.audioManager.isInitialized) {
            
            console.log('Ensuring main menu music is playing...');
            this.audioManager.playMainMenuMusic();
        }
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            // Enable audio on first user interaction
            this.audioManager.enableAudio();
            this.startGame();
        });
        
        // See leaderboard button (start screen)
        document.getElementById('seeLeaderboardButton').addEventListener('click', () => {
            // Enable audio on first user interaction
            this.audioManager.enableAudio();
            this.showLeaderboardScreen();
        });
        
        // Mute button
        document.getElementById('muteButton').addEventListener('click', () => {
            // Enable audio on first user interaction
            this.audioManager.enableAudio();
            const isMuted = this.audioManager.toggleMute();
            const muteButton = document.getElementById('muteButton');
            muteButton.textContent = isMuted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
        });
        
        // Username input with debouncing
        let usernameTimeout;
        document.getElementById('username').addEventListener('input', (e) => {
            this.username = e.target.value.trim();
            
            // Try to ensure music is playing on username input
            setTimeout(() => this.ensureMainMenuMusicPlaying(), 100);
            
            // Clear previous timeout
            if (usernameTimeout) {
                clearTimeout(usernameTimeout);
            }
            
            // Reset UI immediately for basic validation
            const errorElement = document.getElementById('usernameError');
            const startButton = document.getElementById('startButton');
            
            if (this.username.length < 3) {
                errorElement.textContent = 'Username must be at least 3 characters long';
                errorElement.style.color = '#ff4444';
                startButton.disabled = true;
                return;
            }
            
            // Debounce the Firebase check
            usernameTimeout = setTimeout(() => {
                this.validateUsername();
            }, 500); // Wait 500ms after user stops typing
        });
        

        
        // Game over buttons
        document.getElementById('restartButton').addEventListener('click', () => {
            // Enable audio on user interaction
            this.audioManager.enableAudio();
            this.restartGame();
        });
        
        document.getElementById('mainMenuButton').addEventListener('click', () => {
            // Enable audio on user interaction
            this.audioManager.enableAudio();
            this.showMainMenu();
        });
        
        // Back to menu button (leaderboard screen)
        document.getElementById('backToMenuButton').addEventListener('click', () => {
            // Enable audio on user interaction
            this.audioManager.enableAudio();
            this.showScreen('start');
        });
    }
    
    async validateUsername() {
        const errorElement = document.getElementById('usernameError');
        const startButton = document.getElementById('startButton');
        
        // Reset error message color
        errorElement.style.color = '#ff4444'; // Red color for errors
        
        // Basic validation first
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
        
        // Check for special characters and format
        const validPattern = /^[a-zA-Z0-9_-]+( [a-zA-Z0-9_-]+)*$/;
        if (!validPattern.test(this.username)) {
            errorElement.textContent = 'Username can contain letters, numbers, underscore, dash, and single spaces between words';
            startButton.disabled = true;
            return false;
        }
        
        try {
            // Check uniqueness in Firebase
            errorElement.textContent = 'Checking username availability...';
            startButton.disabled = true;
            
            const exists = await window.FirebaseHelper.checkUsernameExists(this.username, this.browserId);
            
            if (exists) {
                errorElement.textContent = 'Username already taken (case-insensitive). Please choose a different one.';
                startButton.disabled = true;
                return false;
            }
            
            // Username is valid and unique
            errorElement.textContent = '✓ Username available';
            errorElement.style.color = '#4CAF50'; // Green color for success
            startButton.disabled = false;
            return true;
            
        } catch (error) {
            console.error('Error checking username:', error);
            errorElement.textContent = 'Error checking username. Please try again.';
            startButton.disabled = true;
            return false;
        }
    }
    
    async startGame() {
        if (!this.username || this.username.length < 3) {
            alert('Please enter a valid username');
            return;
        }
        
        // Final check for username uniqueness before starting
        try {
            const exists = await window.FirebaseHelper.checkUsernameExists(this.username, this.browserId);
            if (exists) {
                alert('Username is already taken (case-insensitive). Please choose a different username.');
                return;
            }
        } catch (error) {
            console.error('Error checking username before game start:', error);
            alert('Error validating username. Please try again.');
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
        
        // Ensure music plays when returning to main menu
        setTimeout(() => {
            if (this.currentScreen === 'start' && !this.audioManager.isMainMenuMusicPlaying()) {
                this.audioManager.playMainMenuMusic();
            }
        }, 100);
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenName + 'Screen').classList.add('active');
        this.currentScreen = screenName;
        
        // Handle background music based on screen
        this.handleBackgroundMusic(screenName);
    }
    
    handleBackgroundMusic(screenName) {
        // Play main menu music on start and leaderboard screens
        if (screenName === 'start' || screenName === 'leaderboard') {
            // Reset pause state when entering menu screens
            this.audioManager.isPaused = false;
            // Stop game music when returning to menu
            this.audioManager.stopGameMusic();
            if (!this.audioManager.isMainMenuMusicPlaying() && !this.audioManager.isMuted) {
                // Reset current time when starting fresh (not resuming)
                if (!this.audioManager.musicShouldBePlaying) {
                    this.audioManager.currentMusicTime = 0;
                }
                setTimeout(() => {
                    this.audioManager.playMainMenuMusic();
                }, 100);
            }
        } else if (screenName === 'game') {
            // Game music is now handled by story mode start, no need to change music here
            this.audioManager.isPaused = false; // Reset pause state
        } else {
            // Stop all music on other screens (gameOver, etc.)
            this.audioManager.stopMainMenuMusic();
            this.audioManager.stopGameMusic();
            this.audioManager.isPaused = false; // Reset pause state
        }
    }

    showLeaderboardScreen() {
        // Show leaderboard screen
        this.showScreen('leaderboard');
        
        // Load and display leaderboard data
        this.displayLeaderboard('leaderboardDisplay');
    }

    async displayLeaderboard(elementId) {
        const leaderboardElement = document.getElementById(elementId);
        
        if (!leaderboardElement) {
            console.error('Leaderboard element not found:', elementId);
            return;
        }
        
        try {
            // Show loading state
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Loading leaderboard...</span></div>';
            
            // Get top 10 scores from Firebase
            const scores = await window.FirebaseHelper.getTopScores(10);
            console.log('Displaying leaderboard from Firebase:', scores);
            
            // Display leaderboard
            if (scores.length === 0) {
                leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
            } else {
                leaderboardElement.innerHTML = scores.map((score, index) => `
                    <div class="leaderboard-item">
                        <span class="rank">${index + 1}</span>
                        <span class="username">${score.username}</span>
                        <span class="score">${score.score}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error displaying leaderboard from Firebase:', error);
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Error loading leaderboard</span></div>';
        }
    }

    async clearLeaderboard() {
        try {
            // Clear all leaderboard data from Firebase
            const success = await window.FirebaseHelper.clearAllScores();
            
            if (success) {
                console.log('Leaderboard completely cleared from Firebase');
                
                // Update the display to show empty leaderboard
                const leaderboardElement = document.getElementById('leaderboard');
                const playerRankElement = document.getElementById('playerRank');
                
                if (leaderboardElement) {
                    leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
                }
                
                if (playerRankElement) {
                    playerRankElement.textContent = '-';
                }
                
                // Also update leaderboard display if we're on the leaderboard screen
                const leaderboardDisplayElement = document.getElementById('leaderboardDisplay');
                if (leaderboardDisplayElement) {
                    leaderboardDisplayElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
                }
                
            } else {
                console.error('Failed to clear leaderboard');
            }
        } catch (error) {
            console.error('Error clearing leaderboard:', error);
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
        window.clearLeaderboard = async () => {
            try {
                const success = await window.FirebaseHelper.clearAllScores();
                if (success) {
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
                    
                    // Also update leaderboard display if available
                    const leaderboardDisplayElement = document.getElementById('leaderboardDisplay');
                    if (leaderboardDisplayElement) {
                        leaderboardDisplayElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
                    }
                } else {
                    console.error('Failed to clear leaderboard via console');
                }
            } catch (error) {
                console.error('Error clearing leaderboard via console:', error);
            }
        };
        
        console.log('Type "clearLeaderboard()" in console to clear leaderboard from Firebase');
    }, 1500); // Increased from 1000 to 1500ms
});
