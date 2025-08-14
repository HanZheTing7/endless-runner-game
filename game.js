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
        
        // Get current leaderboard
        let scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
        console.log('Current scores in localStorage:', scores);
        
        // Get current username
        const username = window.gameManager ? window.gameManager.username : 'Player';
        console.log('Current username:', username);
        console.log('Current game score:', this.score);
        
        // Check if player already has a score and compare with current score
        const existingPlayerIndex = scores.findIndex(score => score.username === username);
        console.log('Existing player index:', existingPlayerIndex);
        
        if (existingPlayerIndex !== -1) {
            // Player exists - only update if new score is higher
            const existingScore = parseInt(scores[existingPlayerIndex].score);
            const newScore = parseInt(this.score);
            console.log('Existing score found:', existingScore, 'Type:', typeof existingScore);
            console.log('New score:', newScore, 'Type:', typeof newScore);
            console.log('Is new score higher?', newScore > existingScore);
            
            if (newScore > existingScore) {
                // New score is higher - update it
                scores[existingPlayerIndex] = {
                    username: username,
                    score: newScore,
                    distance: Math.floor(this.distance),
                    timestamp: Date.now()
                };
                console.log(`Updated ${username} with higher score: ${newScore} (was: ${existingScore})`);
            } else {
                // New score is lower - keep the old higher score
                console.log(`Keeping ${username}'s higher score: ${existingScore} (new was: ${newScore})`);
                // Don't update anything - keep the existing score
            }
        } else {
            // New player - add their score
            scores.push({
                username: username,
                score: parseInt(this.score),
                distance: Math.floor(this.distance),
                timestamp: Date.now()
            });
            console.log(`Added new player ${username} with score ${this.score}`);
        }
        
        console.log('Scores after processing:', scores);
        
        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);
        console.log('Scores after sorting:', scores);
        
        // Keep only top 10
        scores = scores.slice(0, 10);
        console.log('Final scores (top 10):', scores);
        
        // Save to localStorage
        localStorage.setItem('endlessRunnerScores', JSON.stringify(scores));
        
        // Find player rank
        const playerRank = scores.findIndex(score => score.username === username) + 1;
        console.log('Player rank:', playerRank);
        
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
        
        // Draw clouds
        this.drawClouds();
        
        // Draw trees
        this.drawTrees();
        
        // Draw a test cloud and tree in top-left corner to verify drawing works
        this.drawTestElements();
        
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
        
        // Add background debug info
        this.ctx.fillStyle = '#00FFFF'; // Cyan color for background info
        this.ctx.fillText(`Background: Clouds & Trees Active`, 20, 290);
        this.ctx.fillText(`Ground Y: ${this.ground.y}`, 20, 320);
        
        // Add position indicators for first cloud and tree
        this.ctx.fillStyle = '#FFFF00'; // Yellow for position info
        this.ctx.fillText(`Test Cloud: x=${Math.round(50 + Math.sin(Date.now() * 0.002) * 20)}`, 20, 350);
        this.ctx.fillText(`Test Tree: x=${Math.round(200 + Math.sin(Date.now() * 0.0015) * 15)}`, 20, 380);
        
        // Add tree movement debug info
        this.ctx.fillStyle = '#00FF00'; // Green for tree info
        this.ctx.fillText(`Tree Movement: Right to Left`, 20, 410);
        this.ctx.fillText(`Ground Level: y=${this.ground.y}`, 20, 440);
        this.ctx.fillText(`Tree Base: y=${this.ground.y - 60}`, 20, 470);
        
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
                y + height * 0.27 - headSize,  // Changed from 0.03 to align bottom of image with neck
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
            const time = Date.now() * 0.004; // Slower animation - reduced from 0.008 to 0.004
            
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
    
    drawClouds() {
        const ctx = this.ctx;
        const time = Date.now() * 0.001; // Slow cloud movement
        
        // Create multiple clouds at different positions - start them visible on screen
        const cloudPositions = [
            { x: 800, y: 80, size: 80 },   // Start from middle-right, made bigger
            { x: 1000, y: 120, size: 100 }, // Start from middle-right, made bigger
            { x: 1200, y: 60, size: 90 },  // Start from right edge, made bigger
            { x: 1400, y: 100, size: 85 }, // Start from off-screen right, made bigger
            { x: 1600, y: 90, size: 95 }   // Start from off-screen right, made bigger
        ];
        
        cloudPositions.forEach((cloud, index) => {
            // Move clouds from right to left
            let cloudX = cloud.x - time * 20;
            
            // If cloud goes off the left side, wrap it to the right side
            if (cloudX < -cloud.size) {
                cloudX = this.canvas.width + cloud.size;
            }
            
            // Only draw if cloud is visible on screen
            if (cloudX > -cloud.size && cloudX < this.canvas.width + cloud.size) {
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.9; // Made more opaque
                
                // Draw cloud using multiple circles - made bigger and more visible
                ctx.beginPath();
                ctx.arc(cloudX, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
                ctx.arc(cloudX + cloud.size * 0.5, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
                ctx.arc(cloudX + cloud.size * 0.9, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
                ctx.arc(cloudX + cloud.size * 0.3, cloud.y - cloud.size * 0.25, cloud.size * 0.3, 0, Math.PI * 2);
                ctx.arc(cloudX + cloud.size * 0.7, cloud.y - cloud.size * 0.2, cloud.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
                
                // Add cloud outline for better visibility
                ctx.strokeStyle = '#CCCCCC';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
        
        ctx.globalAlpha = 1.0; // Reset transparency
    }
    
    drawTrees() {
        const ctx = this.ctx;
        const time = Date.now() * 0.002; // Very slow tree movement for parallax effect
        
        // Create multiple trees at different positions - start them visible on screen
        const treePositions = [
            { x: 600, y: this.ground.y - 80, size: 120 },  // Start from middle, positioned on ground
            { x: 800, y: this.ground.y - 100, size: 140 },  // Start from middle-right, positioned on ground
            { x: 1000, y: this.ground.y - 70, size: 110 },  // Start from middle-right, positioned on ground
            { x: 1200, y: this.ground.y - 90, size: 130 }, // Start from right edge, positioned on ground
            { x: 1400, y: this.ground.y - 85, size: 125 }, // Start from off-screen right, positioned on ground
            { x: 1600, y: this.ground.y - 95, size: 135 }  // Start from off-screen right, positioned on ground
        ];
        
        treePositions.forEach((tree, index) => {
            // Move trees from right to left (parallax effect)
            let treeX = tree.x - time * 10;
            
            // If tree goes off the left side, wrap it to the right side
            if (treeX < -tree.size) {
                treeX = this.canvas.width + tree.size;
            }
            
            // Only draw if tree is visible on screen
            if (treeX > -tree.size && treeX < this.canvas.width + tree.size) {
                // Draw tree trunk - positioned on the ground
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(treeX - 12, this.ground.y - 60, 24, 60); // Trunk starts from ground, shorter height
                
                // Add trunk outline
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(treeX - 12, this.ground.y - 60, 24, 60);
                
                // Draw tree leaves (multiple circles for foliage) - positioned above trunk
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.arc(treeX, this.ground.y - 85, tree.size * 0.4, 0, Math.PI * 2);
                ctx.arc(treeX - tree.size * 0.3, this.ground.y - 110, tree.size * 0.35, 0, Math.PI * 2);
                ctx.arc(treeX + tree.size * 0.3, this.ground.y - 105, tree.size * 0.3, 0, Math.PI * 2);
                ctx.arc(treeX, this.ground.y - 135, tree.size * 0.25, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
                
                // Add some darker green for depth
                ctx.fillStyle = '#006400';
                ctx.beginPath();
                ctx.arc(treeX - tree.size * 0.2, this.ground.y - 100, tree.size * 0.2, 0, Math.PI * 2);
                ctx.arc(treeX + tree.size * 0.2, this.ground.y - 120, tree.size * 0.2, 0, Math.PI * 2);
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
