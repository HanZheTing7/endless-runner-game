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
        this.gameSpeed = 5.6; // Higher base speed for a snappier start
        this.obstacleFrequency = 1; // Start with 1 obstacle, increases with difficulty
        
        // Game objects (positions will be updated in setupCanvas)
        this.player = { x: 150, y: 450, width: 50, height: 80, velocityY: 0, isJumping: false };
        this.ground = { y: 530, height: 70 };
        this.obstacles = [];
        
        // Ocean life (jumping fish)
        this.fish = [];
        this.lastFishUpdate = Date.now();
        this.initFish();
        
        // Water splashes for fish jumps
        this.splashes = [];
        
        // Track level-up milestones (every 1000 distance)
        this.lastLevelUpMilestone = 0;

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
        
        // Removed story mode full character image usage

        // Jumping head image
        this.characterHeadJump = new Image();
        this.characterHeadJump.onload = () => {
            console.log('Jump head image loaded successfully');
        };
        this.characterHeadJump.onerror = () => {
            console.error('Failed to load jump head image: sk_jump.png');
        };
        this.characterHeadJump.src = 'sk_jump.png';
        
        // Wife head image (Jane)
        this.wifeHead = new Image();
        this.wifeHead.onload = () => {
            console.log('Wife head image (jane.png) loaded successfully');
        };
        this.wifeHead.onerror = () => {
            console.error('Failed to load wife head image: jane.png');
        };
        this.wifeHead.src = 'jane.png';
        
        // Obstacle images
        this.smallDogImage = new Image();
        this.smallDogLoaded = false;
        this.smallDogImage.onload = () => {
            this.smallDogLoaded = true;
            console.log('Small dog obstacle image loaded successfully');
            this.smallDogAspect = (this.smallDogImage.naturalWidth || 60) / (this.smallDogImage.naturalHeight || 50);
        };
        this.smallDogImage.onerror = () => {
            console.error('Failed to load small dog image: sk_dog.png');
        };
        this.smallDogImage.src = 'sk_dog.png';
        
        this.bigDogImage = new Image();
        this.bigDogLoaded = false;
        this.bigDogImage.onload = () => {
            this.bigDogLoaded = true;
            console.log('Big dog obstacle image loaded successfully');
            this.bigDogAspect = (this.bigDogImage.naturalWidth || 90) / (this.bigDogImage.naturalHeight || 70);
        };
        this.bigDogImage.onerror = () => {
            console.error('Failed to load big dog image: bigdog.jpg');
        };
        this.bigDogImage.src = 'bigdog.jpg';
        // Default aspects in case images not yet loaded
        this.smallDogAspect = 1.2;
        this.bigDogAspect = 1.3;
        
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

    createBirdObstacle(x) {
        // Flying bird at a safe height with slight vertical bob
        const screenHeight = this.displayHeight || window.innerHeight;
        const birdHeight = Math.max(20, screenHeight * 0.05);
        const birdWidth = Math.max(28, birdHeight * 1.2);
        const flightY = this.ground.y - (this.player.height * 1.2 + birdHeight * 1.2); // above jump arc
        return {
            x: x,
            y: flightY,
            width: birdWidth,
            height: birdHeight,
            type: 'bird',
            bobPhase: Math.random() * Math.PI * 2
        };
    }

    drawSpaceBackground(width, height, baseSpeed = 0.05) {
        const ctx = this.ctx;
        // Base deep space
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#000010');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        
        // Nebula glows similar to menu
        ctx.save();
        ctx.globalAlpha = 0.25;
        const glow = ctx.createRadialGradient(width * 0.2, height * 0.15, 0, width * 0.2, height * 0.15, Math.max(width, height) * 0.6);
        glow.addColorStop(0, 'rgba(70,30,120,0.8)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
        const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.3, 0, width * 0.8, height * 0.3, Math.max(width, height) * 0.5);
        glow2.addColorStop(0, 'rgba(0,150,255,0.5)');
        glow2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        
        // Initialize starfield once and scroll slowly
        if (!this.spaceStars || !this.spaceStarsInitialized || this.spaceStarsWidth !== width || this.spaceStarsHeight !== height) {
            this.spaceStarsWidth = width;
            this.spaceStarsHeight = height;
            const count = Math.floor((width * height) / 35000);
            this.spaceStars = Array.from({ length: count }).map(() => ({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5 + 0.4,
                layer: Math.random() < 0.5 ? 0.4 : (Math.random() < 0.75 ? 0.7 : 1.0)
            }));
            this.spaceStarsInitialized = true;
        }
        
        // Scroll and draw precomputed stars (very slow parallax)
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#FFFFFF';
        for (let s of this.spaceStars) {
            // Move left slowly; parallax via layer
            s.x -= baseSpeed * s.layer;
            if (s.x < -2) s.x = this.spaceStarsWidth + 2;
            ctx.globalAlpha = 0.45 + 0.4 * s.layer;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;

        // Comets (occasional background streaks)
        if (!this.comets) this.comets = [];
        // Spawn with small probability, limit count
        if (Math.random() < 0.01 && this.comets.length < 2) {
            const startY = Math.random() * height * 0.6;
            this.comets.push({
                x: width + 50,
                y: startY,
                vx: - (2 + Math.random() * 2),
                vy: 0.4 + Math.random() * 0.6,
                len: 80 + Math.random() * 60,
                life: 2000 + Math.random() * 1500,
                born: performance.now()
            });
        }
        // Update and draw comets behind obstacles
        const nowTs = performance.now();
        this.comets = this.comets.filter(c => (nowTs - c.born) < c.life && c.x > -100 && c.y < height + 100);
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        for (const c of this.comets) {
            c.x += c.vx * (1 + baseSpeed * 4);
            c.y += c.vy * (1 + baseSpeed * 2);
            // Draw comet head
            ctx.beginPath();
            ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            // Tail
            const tailX = c.x + c.len * 0.7;
            const tailY = c.y - c.len * 0.3;
            const gradTail = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
            gradTail.addColorStop(0, 'rgba(255,255,255,0.9)');
            gradTail.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = gradTail;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawMoonSurface(width, scrollSpeed = 0.01) {
        const ctx = this.ctx;
        // Ground base
        const groundTop = this.ground.y;
        const grad = ctx.createLinearGradient(0, groundTop, 0, groundTop + this.ground.height);
        grad.addColorStop(0, '#bdbec4');
        grad.addColorStop(1, '#8e8f94');
        ctx.fillStyle = grad;
        ctx.fillRect(0, groundTop, width, this.ground.height);
        
        // Subtle craters with slow horizontal drift to imply movement
        if (!this.moonCraters || this.moonCratersWidth !== width || this.moonCratersGroundTop !== groundTop) {
            this.moonCratersWidth = width;
            this.moonCratersGroundTop = groundTop;
            const craterCount = Math.max(8, Math.floor(width / 120));
            this.moonCraters = Array.from({ length: craterCount }).map((_, i) => {
                return {
                    x: (i + 0.5) * (width / craterCount) + (Math.random() - 0.5) * 40,
                    y: groundTop + this.ground.height * (0.35 + Math.random() * 0.4),
                    rx: 12 + Math.random() * 20,
                    ry: 5 + Math.random() * 10,
                    layer: 0.6 + Math.random() * 0.8
                };
            });
            this.moonScrollX = 0;
        }
        this.moonScrollX = (this.moonScrollX || 0) + scrollSpeed; // very slow
        ctx.save();
        ctx.globalAlpha = 0.28;
        for (let c of this.moonCraters) {
            let cx = c.x - this.moonScrollX * (20 * c.layer);
            // Wrap around
            while (cx < -c.rx) cx += width + c.rx * 2;
            while (cx > width + c.rx) cx -= width + c.rx * 2;
            ctx.beginPath();
            ctx.ellipse(cx, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fill();
        }
        ctx.restore();
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
        // Two fixed-size obstacles: small dog and big dog
        const screenHeight = this.displayHeight || window.innerHeight;

        // Fixed heights relative to screen for consistent look
        const smallHeight = Math.max(50, Math.round(screenHeight * 0.10));
        const bigHeight = Math.max(70, Math.round(screenHeight * 0.15));

        const isBig = Math.random() < 0.5;
        const height = isBig ? bigHeight : smallHeight;

        // Preserve image aspect ratio for width
        const aspect = isBig ? (this.bigDogAspect || 1.3) : (this.smallDogAspect || 1.2);
        const width = Math.round(height * aspect);
        const y = this.ground.y - height;

        return { x, y, width, height, sprite: isBig ? 'bigDog' : 'smallDog' };
    }
    
    updateDifficulty() {
        // Increase game difficulty from the start, ramp every 500 distance
        const tiers = Math.floor(this.distance / 500);
        this.gameSpeed = 5.6 + (tiers * 0.6);
        // Cap max speed
        this.gameSpeed = Math.min(this.gameSpeed, 10.0);
        
        // Increase number of concurrent obstacles every 500 distance (cap for performance)
        this.obstacleFrequency = 1 + tiers;
        this.obstacleFrequency = Math.min(this.obstacleFrequency, 3);
    }
    
    jump() {
        if (!this.player.isJumping) {
            this.player.isJumping = true;
            this.player.velocityY = this.jumpPower;
            
            // Jump sound removed
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
    
    gameLoop(timestamp) {
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = timestamp || performance.now();
        }
        const now = timestamp || performance.now();
        let deltaSeconds = (now - this._lastFrameTime) / 1000;
        this._lastFrameTime = now;

        if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
            deltaSeconds = 0.016;
        } else if (deltaSeconds > 0.05) {
            deltaSeconds = 0.05;
        }

        if (this.storyMode) {
            this.updateStory();
            this.renderStory();
        } else if (this.gameRunning) {
            this.update(deltaSeconds);
            this.render();
        } else {
            return;
        }

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
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
        
        // Draw space background (slow, visible parallax)
        this.drawSpaceBackground(width, height, 0.05);
        
        // Beach vibe elements
        this.drawSun();
        // Draw clouds
        this.drawClouds();
        // Draw ocean before sand
        this.drawOcean();
        
        // Trees removed for cleaner beach look
        
        // Draw sand ground
        this.ctx.fillStyle = '#F2DDA0';
        this.ctx.fillRect(0, this.ground.y, width, this.ground.height);
        
        // Draw character (now in running animation as it moves)
        this.drawStickman(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Add transition instruction text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Get ready to run!', width / 2, height / 4);
    }
    
    update(deltaSeconds = 1/60) {
        // Update player
        if (this.player.isJumping) {
            this.player.velocityY += this.gravity * deltaSeconds * 60;
            this.player.y += this.player.velocityY * deltaSeconds * 60;
            
            if (this.player.y >= this.ground.y - this.player.height) {
                this.player.y = this.ground.y - this.player.height;
                this.player.isJumping = false;
                this.player.velocityY = 0;
            }
        }
        
        // Update obstacles
        const speed = this.gameSpeed * deltaSeconds * 60;
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            obstacle.x -= speed;
        }
        
        // Remove obstacles that are off screen
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > -50);
        
        // Add new obstacles if needed
        if (this.obstacles.length < this.obstacleFrequency) {
            const width = this.displayWidth || window.innerWidth;
            const offset = 250 + Math.random() * 250;
            const newObstacle = this.createRandomObstacle(width + offset);
            this.obstacles.push(newObstacle);
        }
        
        // Update wife position (chasing behavior)
        if (this.wife.isVisible) {
            // Wife tries to catch up to player but ALWAYS stays behind
            const targetDistance = 160; // Desired distance behind player (more gap)
            const currentDistance = this.player.x - this.wife.x;
            
            if (currentDistance > targetDistance + 30) {
                // Wife is too far behind, speed up (but not too much)
                this.wife.x += this.gameSpeed * 0.95 * deltaSeconds * 60;
            } else if (currentDistance < targetDistance - 15) {
                // Wife is too close, slow down significantly
                this.wife.x += this.gameSpeed * 0.3 * deltaSeconds * 60;
            } else {
                // Maintain steady chase at slightly slower speed
                this.wife.x += this.gameSpeed * 0.8 * deltaSeconds * 60;
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
        this.distance += this.gameSpeed * 0.1 * deltaSeconds * 60;
        this.score = Math.floor(this.distance);
        
        // Play level-up tone every 1000 distance (once per milestone)
        const currentMilestone = Math.floor(this.distance / 1000);
        if (currentMilestone > this.lastLevelUpMilestone && currentMilestone >= 1) {
            this.lastLevelUpMilestone = currentMilestone;
            if (window.gameManager && window.gameManager.audioManager) {
                window.gameManager.audioManager.playLevelUpTone();
            }
        }
        
        // Progressive difficulty based on distance
        this.updateDifficulty();
        
        // Update UI (score removed from header)
        const currentDistanceElement = document.getElementById('currentDistance');
        if (currentDistanceElement) {
            currentDistanceElement.textContent = Math.floor(this.distance);
        }
        
        // Check collisions (including birds)
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
        
        if (!playerRankElement) {
            console.error('Player rank element not found');
            return;
        }
        
        // Get current username
        const username = window.gameManager ? window.gameManager.username : 'Player';
        console.log('Current username:', username);
        console.log('Current game score:', this.score);
        
        try {
            // Show loading state
            if (leaderboardElement) {
                leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Loading leaderboard...</span></div>';
            }
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
            let playerRank = await window.FirebaseHelper.getPlayerRank(this.score);
            console.log('Player rank (primary):', playerRank);

            // Fallback: if primary rank retrieval failed or returned invalid value, compute locally
            if (!(typeof playerRank === 'number' && playerRank > 0)) {
                let fallbackScores = Array.isArray(allScores) ? allScores : [];

                // If no scores available from service, try localStorage
                if (fallbackScores.length === 0) {
                    try {
                        const localScores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                        if (Array.isArray(localScores)) {
                            fallbackScores = localScores;
                        }
                    } catch (e) {
                        console.warn('Could not read local scores for rank fallback:', e);
                    }
                }

                const higherCount = fallbackScores.reduce((count, s) => count + ((s && typeof s.score === 'number' && s.score > this.score) ? 1 : 0), 0);
                const computedFallbackRank = higherCount + 1;
                console.log('Computed fallback rank:', computedFallbackRank);
                playerRank = computedFallbackRank;
            }

            // Update UI
            playerRankElement.textContent = playerRank > 0 ? playerRank : '-';
            
            // Display leaderboard if element exists (game over page may not show it)
            if (leaderboardElement) {
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
            }
            
            console.log('Leaderboard updated from Firebase');
            
        } catch (error) {
            console.error('Error loading leaderboard from Firebase:', error);
            
            // Show error message
            if (leaderboardElement) {
                leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Error loading leaderboard</span></div>';
            }

            // Fallback rank computation on error
            try {
                const localScores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                const higherCount = Array.isArray(localScores)
                    ? localScores.reduce((count, s) => count + ((s && typeof s.score === 'number' && s.score > this.score) ? 1 : 0), 0)
                    : 0;
                playerRankElement.textContent = String(higherCount + 1);
            } catch (e) {
                playerRankElement.textContent = '-';
            }
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
        
        // Outer space background (story mode) and moon surface (slower)
        this.drawSpaceBackground(width, height, 0.03);
        this.drawMoonSurface(width);
        
        // Draw vector suit character in story mode, slightly slimmer than gameplay
        const storyWidth = Math.max(30, this.player.width * 0.85); // 15% slimmer
        this.drawStickmanStanding(this.player.x + this.player.width / 2, this.player.y, storyWidth, this.player.height);
        
        // Centered white dialogue text (no bubble)
        if (this.displayedText.length > 0) {
            const ctx = this.ctx;
            const maxTextWidth = Math.floor((this.displayWidth || window.innerWidth) * 0.8);
            const fontSize = Math.max(16, Math.min(28, maxTextWidth * 0.05));
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${fontSize}px Arial`;
            
            // Wrap text to multiple lines to fit width
            const words = this.displayedText.split(' ');
            const lines = [];
            let line = '';
            for (let i = 0; i < words.length; i++) {
                const testLine = line + (line ? ' ' : '') + words[i];
                if (ctx.measureText(testLine).width > maxTextWidth && line) {
                    lines.push(line);
                    line = words[i];
                } else {
                    line = testLine;
                }
            }
            if (line) lines.push(line);
            
            const lineHeight = fontSize * 1.4;
            const totalHeight = lines.length * lineHeight;
            const centerX = (this.displayWidth || window.innerWidth) / 2;
            const centerY = (this.displayHeight || window.innerHeight) / 2;
            const startY = centerY - totalHeight / 2 + lineHeight / 2;
            
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], centerX, startY + i * lineHeight);
            }
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
            this.ctx.fillText('Touch anywhere to continue', width / 2, height - bottomMargin);
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
    
    drawStickmanStanding(centerX, y, width, height) {
        const ctx = this.ctx;
        // Use provided width to match gameplay proportions
        
        // Draw head using image (use jump head if currently jumping)
        const standingHeadImage = this.player && this.player.isJumping && this.characterHeadJump.complete
            ? this.characterHeadJump
            : this.characterHead;
        if (standingHeadImage && standingHeadImage.complete) {
            const headSize = height * 0.8;
            ctx.drawImage(
                standingHeadImage,
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

        // Bow tie (wedding vibe)
        const tieY = y + height * 0.36;
        const tieHalf = Math.max(4, width * 0.06);
        // Left wing
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(centerX - tieHalf, tieY);
        ctx.lineTo(centerX - tieHalf*2, tieY - tieHalf*0.8);
        ctx.lineTo(centerX - tieHalf*2, tieY + tieHalf*0.8);
        ctx.closePath();
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(centerX + tieHalf, tieY);
        ctx.lineTo(centerX + tieHalf*2, tieY - tieHalf*0.8);
        ctx.lineTo(centerX + tieHalf*2, tieY + tieHalf*0.8);
        ctx.closePath();
        ctx.fill();
        // Center knot (gold)
        ctx.fillStyle = '#F1C40F';
        ctx.beginPath();
        ctx.arc(centerX, tieY, Math.max(2, tieHalf*0.5), 0, Math.PI*2);
        ctx.fill();

        // Boutonniere (rose) on left lapel
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(centerX - suitWidth/4.5, y + height * 0.48, Math.max(3, width*0.02), 0, Math.PI*2);
        ctx.fill();
        // Stem
        ctx.strokeStyle = '#27AE60';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - suitWidth/4.5 + 2, y + height * 0.49);
        ctx.lineTo(centerX - suitWidth/4.5 + 2, y + height * 0.56);
        ctx.stroke();
        
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
        
        // Outer space background and moon surface for gameplay
        this.drawSpaceBackground(width, height, 0.05);
        this.drawMoonSurface(width, 0.01);

        // Draw obstacles selecting image by type/size (ground dogs or flying bird)
        this.obstacles.forEach((obstacle) => {
            if (obstacle.type === 'bird') {
                const birdY = obstacle.y + (obstacle.bobY || 0);
                // Simple bird: triangle + wings; could be replaced with image later
                this.ctx.fillStyle = '#CCCCCC';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, birdY + obstacle.height * 0.5);
                this.ctx.lineTo(obstacle.x + obstacle.width, birdY + obstacle.height * 0.5 - obstacle.height * 0.3);
                this.ctx.lineTo(obstacle.x + obstacle.width * 0.6, birdY + obstacle.height);
                this.ctx.closePath();
                this.ctx.fill();
                // Wings
                this.ctx.strokeStyle = '#EEEEEE';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width * 0.4, birdY + obstacle.height * 0.4);
                this.ctx.quadraticCurveTo(obstacle.x + obstacle.width * 0.2, birdY, obstacle.x, birdY + obstacle.height * 0.2);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width * 0.5, birdY + obstacle.height * 0.6);
                this.ctx.quadraticCurveTo(obstacle.x + obstacle.width * 0.3, birdY + obstacle.height * 0.9, obstacle.x + obstacle.width * 0.1, birdY + obstacle.height * 0.8);
                this.ctx.stroke();
            } else {
                // Fixed-size sprite rendering preserving aspect
                const useBig = obstacle.sprite === 'bigDog' || (obstacle.height >= 60);
                const img = useBig ? this.bigDogImage : this.smallDogImage;
                const loaded = useBig ? this.bigDogLoaded : this.smallDogLoaded;
                if (loaded && img) {
                    const drawW = obstacle.width;
                    const drawH = obstacle.height;
                    const drawX = obstacle.x;
                    const drawY = obstacle.y;
                    this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
                } else {
                    this.ctx.fillStyle = '#FF4444';
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                }
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
        const headImage = this.player.isJumping && this.characterHeadJump.complete
            ? this.characterHeadJump
            : this.characterHead;
        if (headImage && headImage.complete) {
            const headSize = height * 0.8; // Increased from 0.24 to 0.4 to make head bigger
            
            // Add cute head shake animation while running (not while jumping)
            let headShakeX = 0;
            if (!this.player.isJumping) {
                const time = Date.now() * 0.008; // Fast shake timing
                headShakeX = Math.sin(time * 3) * 3; // Small side-to-side shake
            }
            
            ctx.drawImage(
                headImage, 
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
        // Bow tie (running)
        const runTieY = y + height * 0.36;
        const runTieHalf = Math.max(4, width * 0.06);
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(centerX - runTieHalf, runTieY);
        ctx.lineTo(centerX - runTieHalf*2, runTieY - runTieHalf*0.8);
        ctx.lineTo(centerX - runTieHalf*2, runTieY + runTieHalf*0.8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + runTieHalf, runTieY);
        ctx.lineTo(centerX + runTieHalf*2, runTieY - runTieHalf*0.8);
        ctx.lineTo(centerX + runTieHalf*2, runTieY + runTieHalf*0.8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#F1C40F';
        ctx.beginPath();
        ctx.arc(centerX, runTieY, Math.max(2, runTieHalf*0.5), 0, Math.PI*2);
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
        
        // Veil (draw behind head)
        (function drawVeil() {
            const ctx = self.ctx || this.ctx;
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(centerX, y + height * 0.05);
            ctx.quadraticCurveTo(centerX + width * 0.6, y + height * 0.42, centerX, y + height * 0.86);
            ctx.quadraticCurveTo(centerX - width * 0.6, y + height * 0.42, centerX, y + height * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }).call(this);

        // Draw wife's head using image (Jane)
        if (this.wifeHead && this.wifeHead.complete) {
            const headSize = height * 0.8;
            // Lower the head so it aligns similar to player's head y
            ctx.drawImage(this.wifeHead, centerX - headSize / 2, y + height * 0.25 - headSize * 0.75, headSize, headSize);
        } else {
            // Fallback: simple head circle
            ctx.fillStyle = '#FFD1DC';
            ctx.beginPath();
            ctx.arc(centerX, y + height * 0.15, height * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Pearl necklace (pure white, subtle shine)
        {
            const pearls = 11;
            const radius = Math.max(10, width * 0.22);
            const baseY = y + height * 0.28;
            const pearlR = Math.max(1.6, height * 0.013);
            ctx.save();
            for (let i = 0; i < pearls; i++) {
                const t = i / (pearls - 1);
                const px = centerX - radius + t * (radius * 2);
                const py = baseY + Math.sin((t - 0.5) * Math.PI) * (pearlR * 1.2);
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(px, py, pearlR, 0, Math.PI * 2);
                ctx.fill();
                // Tiny highlight
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath();
                ctx.arc(px - pearlR * 0.35, py - pearlR * 0.35, pearlR * 0.35, 0, Math.PI * 2);
                ctx.fill();
                // Thin outline for definition
                ctx.strokeStyle = 'rgba(220,220,220,0.8)';
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.arc(px, py, pearlR, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        // Draw wedding dress body (white A-line with subtle shading)
        const screenW = this.displayWidth || window.innerWidth;
        const dressWidth = Math.min(width * 1.2, screenW * 0.42); // thinner ball gown silhouette
        const bodiceTopY = y + height * 0.26;
        const waistY = y + height * 0.34;
        const hemY = y + height * 0.9;
        
        // Ball gown skirt with gentle curvature
        const skirtGrad = ctx.createLinearGradient(0, waistY, 0, hemY);
        skirtGrad.addColorStop(0, '#FFFFFF');
        skirtGrad.addColorStop(1, '#F5F5F5');
        ctx.fillStyle = skirtGrad;
        ctx.strokeStyle = '#E6E6E6';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(centerX - dressWidth * 0.18, waistY);
        ctx.quadraticCurveTo(centerX, waistY - height * 0.06, centerX + dressWidth * 0.18, waistY);
        ctx.quadraticCurveTo(centerX + dressWidth * 0.42, y + height * 0.65, centerX + dressWidth * 0.38, hemY);
        ctx.lineTo(centerX - dressWidth * 0.38, hemY);
        ctx.quadraticCurveTo(centerX - dressWidth * 0.42, y + height * 0.65, centerX - dressWidth * 0.18, waistY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Layered tulle overlay (subtle)
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(centerX - dressWidth * 0.16, waistY + height * 0.02);
        ctx.quadraticCurveTo(centerX, waistY + height * 0.06, centerX + dressWidth * 0.16, waistY + height * 0.02);
        ctx.quadraticCurveTo(centerX + dressWidth * 0.36, y + height * 0.66, centerX + dressWidth * 0.33, hemY - 6);
        ctx.lineTo(centerX - dressWidth * 0.33, hemY - 6);
        ctx.quadraticCurveTo(centerX - dressWidth * 0.36, y + height * 0.66, centerX - dressWidth * 0.16, waistY + height * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Lace hem (scalloped)
        ctx.save();
        ctx.strokeStyle = 'rgba(230,230,230,0.9)';
        ctx.lineWidth = 1;
        for (let i = -dressWidth * 0.48; i <= dressWidth * 0.48; i += 14) {
            ctx.beginPath();
            ctx.arc(centerX + i, hemY + 1, 6, 0, Math.PI);
            ctx.stroke();
        }
        ctx.restore();
        
        // Bodice (sweetheart neckline)
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E6E6E6';
        ctx.beginPath();
        const bodiceW = dressWidth * 0.5;
        ctx.moveTo(centerX - bodiceW * 0.5, bodiceTopY);
        ctx.quadraticCurveTo(centerX - bodiceW * 0.25, bodiceTopY - height * 0.06, centerX, bodiceTopY);
        ctx.quadraticCurveTo(centerX + bodiceW * 0.25, bodiceTopY - height * 0.06, centerX + bodiceW * 0.5, bodiceTopY);
        ctx.lineTo(centerX + bodiceW * 0.5, waistY);
        ctx.lineTo(centerX - bodiceW * 0.5, waistY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Waist ribbon
        ctx.strokeStyle = 'rgba(210,210,210,0.9)';
        ctx.beginPath();
        ctx.moveTo(centerX - bodiceW * 0.5, waistY);
        ctx.lineTo(centerX + bodiceW * 0.5, waistY);
        ctx.stroke();
        
        // Simple belt detail
        ctx.strokeStyle = 'rgba(200,200,200,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - bodiceW * 0.28, bodiceTopY + height * 0.02);
        ctx.lineTo(centerX + bodiceW * 0.28, bodiceTopY + height * 0.02);
        ctx.stroke();
        
        // Running animation for wife
        const time = Date.now() * 0.005; // Slightly different timing than husband
        const cycle = (time * 2) % (Math.PI * 2);
        
        // Body bounce
        const bodyBounce = Math.sin(cycle * 2) * 0.015;
        const bounceOffset = height * bodyBounce;
        
        // Arm animation (subtle while running in dress)
        const leftArmSwing = Math.sin(cycle * 2) * 0.2;
        const rightArmSwing = Math.sin(cycle * 2 + Math.PI) * 0.2;
        const baseReach = 0.55;
        
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
            const screenWidth = this.displayWidth || window.innerWidth;
            this.cloudPositions = [
                { x: screenWidth * 0.2,  y: 80,  size: 80,  currentX: screenWidth * 0.2  }, // Visible on screen
                { x: screenWidth * 0.6,  y: 120, size: 100, currentX: screenWidth * 0.6  }, // Visible on screen
                { x: screenWidth * 1.1,  y: 60,  size: 90,  currentX: screenWidth * 1.1  }  // Just off-screen right
            ];
        }
        
        this.cloudPositions.forEach((cloud, index) => {
            // Update current position - move from right to left
            cloud.currentX -= 0.3; // Same speed as trees
            
            // If cloud goes off the left side, wrap it to the right side
            if (cloud.currentX < -cloud.size) {
                const screenWidth = this.displayWidth || window.innerWidth;
                cloud.currentX = screenWidth + cloud.size + Math.random() * 200; // Add some randomness
            }
            
            // Only draw if cloud is visible on screen
            const screenWidth = this.displayWidth || window.innerWidth;
            if (cloud.currentX > -cloud.size && cloud.currentX < screenWidth + cloud.size) {
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
    
    drawSun() {
        const ctx = this.ctx;
        // Sun in the top-right
        const width = this.displayWidth || window.innerWidth;
        ctx.save();
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(width - 100, 100, 40, 0, Math.PI * 2);
        ctx.fill();
        // Sun glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFE082';
        ctx.beginPath();
        ctx.arc(width - 100, 100, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    drawOcean() {
        const ctx = this.ctx;
        // Ocean removed in space theme
    }
    
    spawnSplash(x, y) {
        // Create multiple droplets per splash
        const count = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            this.splashes.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y,
                vx: (Math.random() - 0.5) * 1.2,
                vy: - (0.8 + Math.random() * 0.8),
                life: 600 + Math.random() * 300,
                born: Date.now(),
                size: 1 + Math.random() * 2
            });
        }
    }
    
    updateAndDrawSplashes(oceanTop, oceanHeight) {
        const ctx = this.ctx;
        const now = Date.now();
        // Gravity for droplets
        const g = 0.0025;
        this.splashes = this.splashes.filter(sp => now - sp.born < sp.life);
        this.splashes.forEach(sp => {
            const dt = now - sp.born;
            // Update position
            sp.x += sp.vx * (dt * 0.6);
            sp.y += sp.vy * (dt * 0.6) + 0.5 * g * dt * dt;
            
            // Stop at water surface
            const waterY = oceanTop + oceanHeight - 1;
            if (sp.y > waterY) sp.y = waterY;
            
            // Fade out near end of life
            const lifeRatio = 1 - (dt / sp.life);
            ctx.globalAlpha = Math.max(0, Math.min(1, lifeRatio));
            ctx.fillStyle = '#E1F5FE';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
    }
    
    initFish() {
        // Disable fish in space theme
        this.fish = [];
        return;
        const width = this.displayWidth || window.innerWidth;
        const speciesOptions = [
            { name: 'clown',   bodyColor: '#FF7043', stripe: true,  stripeColor: '#FFFFFF', stripeCount: 2, rx: 10, ry: 6, tailLen: 6, tailH: 5 },
            { name: 'blueTang',bodyColor: '#29B6F6', stripe: false, rx: 11, ry: 7, tailLen: 7, tailH: 5 },
            { name: 'yellow',  bodyColor: '#FFD54F', stripe: false, rx: 9,  ry: 6, tailLen: 6, tailH: 5 },
            { name: 'pink',    bodyColor: '#EC407A', stripe: false, rx: 8,  ry: 5, tailLen: 5, tailH: 4 }
        ];
        // Create 4 fish with staggered positions and timings
        this.fish = Array.from({ length: 4 }).map((_, i) => {
            const sp = speciesOptions[Math.floor(Math.random() * speciesOptions.length)];
            return {
                baseX: width * (0.18 + i * 0.22),
                x: width * (0.18 + i * 0.22),
                phase: Math.random() * Math.PI * 2,
                jumpIntervalMs: 2800 + i * 900 + Math.random() * 1500,
                jumpStart: Date.now() - Math.random() * 3000,
                jumping: false,
                direction: Math.random() < 0.5 ? 1 : -1,
                // species properties
                bodyColor: sp.bodyColor,
                stripe: sp.stripe,
                stripeColor: sp.stripeColor || '#FFFFFF',
                stripeCount: sp.stripeCount || 0,
                rx: sp.rx,
                ry: sp.ry,
                tailLen: sp.tailLen,
                tailH: sp.tailH
            };
        });
    }
    
    updateFish(oceanTop, oceanHeight, screenWidth) {
        // Disabled in space theme
        return;
        const now = Date.now();
        this.fish.forEach(f => {
            // Start jump if interval elapsed
            if (!f.jumping && now - f.jumpStart > f.jumpIntervalMs) {
                f.jumping = true;
                f.jumpStart = now;
                // Create splash at start of jump
                this.spawnSplash(f.x, oceanTop + oceanHeight - 2);
            }
            
            if (f.jumping) {
                const t = Math.min(1, (now - f.jumpStart) / 1200); // 1.2s jump
                // Parabolic arc
                const arc = Math.sin(t * Math.PI);
                const jumpHeight = oceanHeight * 1.2; // jump slightly above ocean
                f.y = oceanTop + oceanHeight - arc * jumpHeight;
                // Horizontal drift during jump
                f.x = f.baseX + f.direction * arc * 40;
                // End jump
                if (t >= 1) {
                    f.jumping = false;
                    f.jumpStart = now;
                    f.baseX += f.direction * 20; // slight progression across the water
                    // Keep within screen
                    if (f.baseX < 40) f.baseX = 40;
                    if (f.baseX > screenWidth - 40) f.baseX = screenWidth - 40;
                    // Splash on re-entry
                    this.spawnSplash(f.x, oceanTop + oceanHeight - 2);
                }
            } else {
                // Idle under water (minor species variance)
                const idle = Math.sin((now + f.phase * 1000) * 0.003) * 6;
                f.y = oceanTop + oceanHeight - 10 + idle; // stay inside water
                // Ensure fish stays below surface when not jumping
                const surfaceY = oceanTop + oceanHeight - 2;
                if (f.y < surfaceY) f.y = surfaceY;
                const mag = 8 + (f.rx - 8) * 1.5; // larger fish sway a bit more
                f.x = f.baseX + Math.sin((now + f.phase * 1000) * 0.002) * mag;
            }
        });
    }
    
    drawFish(oceanTop, oceanHeight) {
        // Disabled in space theme
        return;
        const ctx = this.ctx;
        this.fish.forEach(f => {
            const surfaceY = oceanTop + oceanHeight - 4;
            // Only render fish when above the water surface (jumping)
            if (f.y >= surfaceY) {
                return;
            }
            // Body (species-based)
            ctx.fillStyle = f.bodyColor;
            ctx.beginPath();
            ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Optional stripes (clownfish look)
            if (f.stripe && f.stripeCount > 0) {
                ctx.fillStyle = f.stripeColor;
                for (let s = 1; s <= f.stripeCount; s++) {
                    const sx = f.x - f.rx * (0.2 + 0.25 * (s - 1));
                    ctx.beginPath();
                    ctx.ellipse(sx, f.y, Math.max(1.5, f.rx * 0.18), f.ry * 0.9, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Tail (species-based)
            ctx.beginPath();
            ctx.moveTo(f.x - f.rx, f.y);
            ctx.lineTo(f.x - f.rx - f.tailLen, f.y - f.tailH);
            ctx.lineTo(f.x - f.rx - f.tailLen, f.y + f.tailH);
            ctx.closePath();
            ctx.fill();
            
            // Dorsal fin (small triangle on top)
            ctx.beginPath();
            ctx.moveTo(f.x - f.rx * 0.2, f.y - f.ry);
            ctx.lineTo(f.x, f.y - f.ry - 4);
            ctx.lineTo(f.x + 3, f.y - f.ry + 1);
            ctx.closePath();
            ctx.fill();
            
            // Eye when above water
            if (f.y < oceanTop + oceanHeight - 4) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(f.x + 4, f.y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(f.x + 4, f.y - 2, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    drawTrees() {
        const ctx = this.ctx;
        const time = Date.now() * 0.002; // Very slow tree movement for parallax effect
        
        // Initialize tree positions if not already done
        if (!this.treePositions) {
            // Use palm positions based on screen width so at least some are visible immediately
            const screenWidth = this.displayWidth || window.innerWidth;
            this.treePositions = [
                { x: screenWidth * 0.25, y: this.ground.y - 20, size: 110, currentX: screenWidth * 0.25 },  // Visible
                { x: screenWidth * 0.75, y: this.ground.y - 30, size: 130, currentX: screenWidth * 0.75 },  // Visible
                { x: screenWidth * 1.2,  y: this.ground.y - 25, size: 120, currentX: screenWidth * 1.2 }    // Just off-screen
            ];
        }
        
        this.treePositions.forEach((tree, index) => {
            // Update current position - move from right to left (parallax effect)
            tree.currentX -= 0.3; // Increased movement speed for better visibility
            
            // If tree goes off the left side, wrap it to the right side
            if (tree.currentX < -tree.size) {
                const screenWidth = this.displayWidth || window.innerWidth;
                tree.currentX = screenWidth + tree.size + Math.random() * 300; // Add some randomness
            }
            
            // Only draw if palm is visible on screen
            const screenWidth = this.displayWidth || window.innerWidth;
            if (tree.currentX > -tree.size && tree.currentX < screenWidth + tree.size) {
                // Palm trunk (curved)
                ctx.strokeStyle = '#A0522D';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(tree.currentX, this.ground.y);
                ctx.quadraticCurveTo(tree.currentX + 20, this.ground.y - tree.size * 0.6, tree.currentX + 5, tree.y);
                ctx.stroke();
                
                // Palm leaves (coconut palm)
                ctx.strokeStyle = '#2E8B57';
                ctx.lineWidth = 4;
                for (let a = -Math.PI / 2; a <= Math.PI / 2; a += Math.PI / 8) {
                    ctx.beginPath();
                    ctx.moveTo(tree.currentX + 5, tree.y);
                    ctx.quadraticCurveTo(
                        tree.currentX + 5 + Math.cos(a) * 35,
                        tree.y + Math.sin(a) * 18,
                        tree.currentX + 5 + Math.cos(a) * 80,
                        tree.y + Math.sin(a) * 45
                    );
                    ctx.stroke();
                }
                // Coconuts cluster under leaves
                ctx.fillStyle = '#6D4C41';
                const cx = tree.currentX + 2;
                const cy = tree.y + 8;
                ctx.beginPath();
                ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                ctx.arc(cx + 8, cy + 4, 5, 0, Math.PI * 2);
                ctx.arc(cx - 8, cy + 4, 5, 0, Math.PI * 2);
                ctx.fill();
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
            // Jump sound removed
            
            // Game over sound
            await this.loadSound('lose', 'lose.mp3', 'gameOver');
            
            // Background music (main menu)
            await this.loadSound('main_menu', 'maplestory.mp3', 'music');
            
            // Game music (plays during gameplay)
            await this.loadSound('game_music', 'game_music.mp3', 'gameMusic');
            
            // Level up tone (every 1000 distance)
            await this.loadSound('level_up', '1000_distance.mp3', 'powerUp');
            
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
        // Removed: no audio for jump
    }
    
    playLoseSound() {
        // Play game over sound with full volume
        this.playSound('lose', {
            volume: this.sfxVolume * 1.2, // Slightly louder for impact
            pitch: 1.0 // No pitch variation for lose sound
        });
    }
    
    playLevelUpTone() {
        // Short celebratory tone for milestones
        this.playSound('level_up', {
            volume: this.sfxVolume * 1.0,
            pitch: 1.0
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
        
        // See leaderboard button (start screen) - guard if not present
        const seeLeaderboardButton = document.getElementById('seeLeaderboardButton');
        if (seeLeaderboardButton) {
            seeLeaderboardButton.addEventListener('click', () => {
                // Enable audio on first user interaction
                this.audioManager.enableAudio();
                this.showLeaderboardScreen();
            });
        }
        
        // Mute icon (top-left)
        const muteToggle = document.getElementById('muteToggle');
        if (muteToggle) {
            muteToggle.addEventListener('click', () => {
                this.audioManager.enableAudio();
                const isMuted = this.audioManager.toggleMute();
                muteToggle.textContent = isMuted ? '🔇' : '🔊';
            });
        }
        
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
        
        // When entering start screen, display Top 5 leaderboard if container exists
        if (screenName === 'start') {
            const startLb = document.getElementById('startLeaderboard');
            if (startLb) {
                this.displayLeaderboard('startLeaderboard', 5);
            }

            // Generate starfield lazily if not present
            const starfield = document.getElementById('starfield');
            if (starfield && starfield.childElementCount === 0) {
                this.generateStarfield(starfield);
            }
        }
        
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

    async displayLeaderboard(elementId, limit = 10) {
        const leaderboardElement = document.getElementById(elementId);
        
        if (!leaderboardElement) {
            console.error('Leaderboard element not found:', elementId);
            return;
        }
        
        try {
            // Show loading state
            leaderboardElement.innerHTML = '<div class="leaderboard-item"><span>Loading leaderboard...</span></div>';
            
            // Get top N scores from Firebase
            const scores = await window.FirebaseHelper.getTopScores(limit);
            console.log('Displaying leaderboard from Firebase:', scores);
            
            // Display leaderboard
            if (scores.length === 0) {
                const emptyText = elementId === 'startLeaderboard'
                    ? '<div class="leaderboard-line">No scores yet</div>'
                    : '<div class="leaderboard-item"><span>No scores yet</span></div>';
                leaderboardElement.innerHTML = emptyText;
            } else {
                if (elementId === 'startLeaderboard') {
                    // Text-only list for start screen with aligned columns
                    leaderboardElement.classList.add('text-only');
                    leaderboardElement.innerHTML = scores.map((score, index) => `
                        <div class="leaderboard-line">
                            <span class="rank-col">${index + 1}.</span>
                            <span class="name-col">${score.username}</span>
                            <span class="score-col">${score.score}</span>
                        </div>
                    `).join('');
                } else {
                    // Default boxed rows for other screens
                    leaderboardElement.innerHTML = scores.map((score, index) => `
                        <div class="leaderboard-item">
                            <span class="rank">${index + 1}</span>
                            <span class="username">${score.username}</span>
                            <span class="score">${score.score}</span>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            console.error('Error displaying leaderboard from Firebase:', error);
            const errorHtml = elementId === 'startLeaderboard'
                ? '<div class="leaderboard-line">Error loading leaderboard</div>'
                : '<div class="leaderboard-item"><span>Error loading leaderboard</span></div>';
            leaderboardElement.innerHTML = errorHtml;
        }
    }

    generateStarfield(container) {
        try {
            const width = container.clientWidth || window.innerWidth;
            const height = container.clientHeight || window.innerHeight;
            const starCount = Math.floor((width * height) / 6000); // slightly denser for visibility
            const sizes = ['small', 'medium', 'large'];
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star ' + sizes[Math.floor(Math.random() * sizes.length)];
                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const delay = (Math.random() * 2).toFixed(2);
                const duration = (1.8 + Math.random() * 2.2).toFixed(2);
                star.style.left = x + '%';
                star.style.top = y + '%';
                star.style.animationDelay = delay + 's';
                star.style.animationDuration = duration + 's';
                container.appendChild(star);
            }
        } catch (e) {
            console.warn('Failed generating starfield:', e);
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

                // Also update start screen leaderboard if present
                const startLeaderboardElement = document.getElementById('startLeaderboard');
                if (startLeaderboardElement) {
                    startLeaderboardElement.innerHTML = '<div class="leaderboard-item"><span>No scores yet</span></div>';
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
