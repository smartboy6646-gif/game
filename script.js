// Game Variables
let canvas, ctx;
let gameActive = false;
let currentLevel = 1;
let score = 0;
let lives = 3;
let isPaused = false;
let player;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let powerUps = [];
let explosions = [];
let keys = {};
let touchStartX = 0;
let touchStartY = 0;
let touchX = 0;
let touchY = 0;
let isTouching = false;
let gameLoopId;
let levelComplete = false;
let levelStartTime = 0;
let enemiesDefeatedThisLevel = 0;

// Level configurations
const levels = [
    { // Level 1
        enemyCount: 8,
        enemySpeed: 2,
        enemyFireRate: 0.005,
        enemyHealth: 1,
        bgColor: '#0a0a1a',
        enemyType: 'basic'
    },
    { // Level 2
        enemyCount: 12,
        enemySpeed: 2.5,
        enemyFireRate: 0.007,
        enemyHealth: 1,
        bgColor: '#0a1a1a',
        enemyType: 'basic'
    },
    { // Level 3
        enemyCount: 15,
        enemySpeed: 3,
        enemyFireRate: 0.01,
        enemyHealth: 2,
        bgColor: '#1a0a1a',
        enemyType: 'advanced'
    },
    { // Level 4
        enemyCount: 18,
        enemySpeed: 3.5,
        enemyFireRate: 0.012,
        enemyHealth: 2,
        bgColor: '#1a1a0a',
        enemyType: 'advanced'
    },
    { // Level 5
        enemyCount: 1, // Boss
        enemySpeed: 1.5,
        enemyFireRate: 0.02,
        enemyHealth: 20,
        bgColor: '#2a0a1a',
        enemyType: 'boss'
    }
];

// Game Objects
class Player {
    constructor() {
        this.width = 40;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 6;
        this.color = '#6ee7ff';
        this.lastShot = 0;
        this.shootDelay = 300; // ms
        this.health = 100;
    }
    
    draw() {
        // Draw player ship
        ctx.fillStyle = this.color;
        
        // Ship body
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Engine glow
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height + 5, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/3, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    update() {
        // Move with touch
        if (isTouching) {
            this.x = touchX - this.width/2;
            this.y = touchY - this.height/2;
        }
        
        // Keep player within bounds
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shootDelay) {
            bullets.push(new Bullet(this.x + this.width/2 - 2.5, this.y, 1));
            this.lastShot = now;
            playShootSound();
        }
    }
}

class Enemy {
    constructor(type, level) {
        this.type = type || levels[currentLevel-1].enemyType;
        this.level = level || currentLevel;
        
        if (this.type === 'boss') {
            this.width = 120;
            this.height = 80;
            this.health = levels[currentLevel-1].enemyHealth;
            this.maxHealth = this.health;
            this.color = '#ff4444';
            this.speed = levels[currentLevel-1].enemySpeed * 0.7;
        } else if (this.type === 'advanced') {
            this.width = 45;
            this.height = 45;
            this.health = levels[currentLevel-1].enemyHealth;
            this.maxHealth = this.health;
            this.color = '#ffaa44';
            this.speed = levels[currentLevel-1].enemySpeed;
        } else {
            this.width = 35;
            this.height = 35;
            this.health = levels[currentLevel-1].enemyHealth;
            this.maxHealth = this.health;
            this.color = '#44aaff';
            this.speed = levels[currentLevel-1].enemySpeed;
        }
        
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }
    
    draw() {
        // Draw enemy based on type
        ctx.fillStyle = this.color;
        
        if (this.type === 'boss') {
            // Boss enemy
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Boss details
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw health bar
            const barWidth = 100;
            const barHeight = 8;
            const barX = this.x + this.width/2 - barWidth/2;
            const barY = this.y - 15;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#00ff00';
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            ctx.fillRect(barX, barY, healthWidth, barHeight);
        } else {
            // Basic enemy shape
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            // Enemy details
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/3, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    update() {
        // Move enemy
        this.y += this.speed;
        this.x += Math.sin(this.y * 0.05) * this.direction * 1.5;
        
        // Check if enemy shoots
        if (Math.random() < levels[currentLevel-1].enemyFireRate) {
            this.shoot();
        }
        
        // Return true if enemy is off screen
        return this.y > canvas.height;
    }
    
    shoot() {
        if (this.type === 'boss') {
            // Boss shoots multiple bullets
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 0.4) - Math.PI;
                enemyBullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 2, angle));
            }
        } else {
            enemyBullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 2));
        }
    }
    
    hit() {
        this.health--;
        if (this.health <= 0) {
            // Create explosion
            explosions.push(new Explosion(this.x + this.width/2, this.y + this.height/2));
            enemiesDefeatedThisLevel++;
            
            // Drop power-up randomly
            if (Math.random() < 0.2) {
                powerUps.push(new PowerUp(this.x + this.width/2, this.y + this.height/2));
            }
            
            // Add score based on enemy type
            if (this.type === 'boss') {
                score += 1000;
            } else if (this.type === 'advanced') {
                score += 150;
            } else {
                score += 100;
            }
            
            updateScore();
            return true;
        }
        return false;
    }
}

class Bullet {
    constructor(x, y, speed, angle = -Math.PI/2) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = speed;
        this.color = speed === 1 ? '#ffff00' : '#ff4444';
        this.angle = angle;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
    }
    
    update() {
        // Move bullet based on angle
        this.x += Math.cos(this.angle) * this.speed * 5;
        this.y += Math.sin(this.angle) * this.speed * 5;
        
        // Return true if bullet is off screen
        return this.y < 0 || this.y > canvas.height || this.x < 0 || this.x > canvas.width;
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = Math.random() < 0.7 ? 'score' : 'health';
        this.color = this.type === 'score' ? '#ffff00' : '#00ff00';
        this.speed = 2;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw symbol
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type === 'score' ? 'S' : 'H', this.x, this.y);
    }
    
    update() {
        this.y += this.speed;
        
        // Return true if power-up is off screen
        return this.y > canvas.height;
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 30;
        this.growthRate = 2;
        this.alpha = 1;
        this.fadeRate = 0.05;
    }
    
    draw() {
        ctx.fillStyle = `rgba(255, 100, 0, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    update() {
        this.radius += this.growthRate;
        this.alpha -= this.fadeRate;
        
        // Return true if explosion is done
        return this.alpha <= 0 || this.radius >= this.maxRadius;
    }
}

// Game Functions
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Setup event listeners
    setupEventListeners();
    
    // Show start screen
    showScreen('startScreen');
}

function resizeCanvas() {
    const container = document.querySelector('.container');
    const gameScreen = document.getElementById('gameScreen');
    const header = document.querySelector('.game-header');
    const controls = document.querySelector('.controls');
    
    const availableHeight = window.innerHeight;
    const headerHeight = header ? header.offsetHeight : 80;
    const controlsHeight = controls ? controls.offsetHeight : 100;
    
    canvas.width = Math.min(window.innerWidth - 20, 600);
    canvas.height = Math.min(availableHeight - headerHeight - controlsHeight - 40, 600);
}

function setupEventListeners() {
    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
        startGame();
    });
    
    // How to play buttons
    document.getElementById('howToPlayBtn').addEventListener('click', () => {
        showScreen('howToPlayScreen');
    });
    
    document.getElementById('backFromHowToBtn').addEventListener('click', () => {
        showScreen('startScreen');
    });
    
    // Level buttons
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLevel = parseInt(btn.dataset.level);
            document.getElementById('startBtn').innerHTML = `<i class="fas fa-play"></i> START LEVEL ${currentLevel}`;
        });
    });
    
    // Game controls
    document.getElementById('shootBtn').addEventListener('click', () => {
        if (gameActive && !isPaused) {
            player.shoot();
        }
    });
    
    document.getElementById('pauseBtn').addEventListener('click', () => {
        if (gameActive) {
            pauseGame();
        }
    });
    
    // Pause screen buttons
    document.getElementById('resumeBtn').addEventListener('click', () => {
        resumeGame();
    });
    
    document.getElementById('restartBtn').addEventListener('click', () => {
        startLevel(currentLevel);
        showScreen('gameScreen');
    });
    
    document.getElementById('quitBtn').addEventListener('click', () => {
        gameActive = false;
        showScreen('startScreen');
    });
    
    // Level complete screen
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        if (currentLevel < 5) {
            currentLevel++;
            startLevel(currentLevel);
            showScreen('gameScreen');
        } else {
            // Game completed
            showScreen('startScreen');
        }
    });
    
    document.getElementById('menuFromCompleteBtn').addEventListener('click', () => {
        showScreen('startScreen');
    });
    
    // Game over screen
    document.getElementById('restartGameBtn').addEventListener('click', () => {
        startGame();
    });
    
    document.getElementById('menuFromGameOverBtn').addEventListener('click', () => {
        showScreen('startScreen');
    });
    
    // Touch controls for canvas
    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', handleTouchEnd, {passive: false});
    
    // Mouse controls for canvas (for testing on desktop)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Keyboard controls (for testing)
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        if (e.key === ' ' && gameActive && !isPaused) {
            player.shoot();
        }
        
        if (e.key === 'p' && gameActive) {
            if (isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    touchStartX = touch.clientX - rect.left;
    touchStartY = touch.clientY - rect.top;
    touchX = touchStartX;
    touchY = touchStartY;
    isTouching = true;
    
    // Shoot if touching right side of screen
    if (touchStartX > canvas.width * 0.6 && gameActive && !isPaused) {
        player.shoot();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isTouching) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    touchX = touch.clientX - rect.left;
    touchY = touch.clientY - rect.top;
}

function handleTouchEnd(e) {
    e.preventDefault();
    isTouching = false;
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    
    touchStartX = e.clientX - rect.left;
    touchStartY = e.clientY - rect.top;
    touchX = touchStartX;
    touchY = touchStartY;
    isTouching = true;
    
    // Shoot if clicking right side of screen
    if (touchStartX > canvas.width * 0.6 && gameActive && !isPaused) {
        player.shoot();
    }
}

function handleMouseMove(e) {
    if (!isTouching) return;
    
    const rect = canvas.getBoundingClientRect();
    touchX = e.clientX - rect.left;
    touchY = e.clientY - rect.top;
}

function handleMouseUp(e) {
    isTouching = false;
}

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    document.getElementById(screenId).classList.add('active');
    
    // If showing game screen, ensure game loop is running
    if (screenId === 'gameScreen' && gameActive && !isPaused) {
        if (!gameLoopId) {
            gameLoop();
        }
    }
}

function startGame() {
    score = 0;
    lives = 3;
    currentLevel = 1;
    updateScore();
    updateLives();
    
    startLevel(currentLevel);
    showScreen('gameScreen');
}

function startLevel(level) {
    currentLevel = level;
    levelComplete = false;
    enemiesDefeatedThisLevel = 0;
    levelStartTime = Date.now();
    
    // Reset game objects
    player = new Player();
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    explosions = [];
    
    // Create enemies based on level
    const levelConfig = levels[level-1];
    
    if (levelConfig.enemy
