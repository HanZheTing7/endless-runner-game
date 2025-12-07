// Language Management System
class LanguageManager {
    constructor() {
        this.currentLanguage = 'en'; // Default to English
        this.translations = {
            en: {
                // Language selection
                'chooseLanguage': 'Choose Language',
                'english': 'English',
                'chinese': '中文',

                // Start screen
                'username': 'Username',
                'start': 'Start',
                'leaderboard': 'LEADERBOARD',
                'controls': 'Controls:',
                'tapToJump': '• Tap to Jump',
                'avoidObstacles': '• Avoid obstacles and run as far as possible!',

                // Game over screen
                'gameOver': 'GAME OVER',
                'groomSleeping': 'Groom is sleeping couch tonight',
                'finalScore': 'Final Score: ',
                'distance': 'Distance: ',
                'yourRank': 'Your Rank: ',
                'playAgain': 'PLAY AGAIN',
                'mainMenu': 'MAIN MENU',

                // Storyline (will be added to game.js)
                'storyline': {
                    'part1': 'Meet Wong Siew Keat.',
                    'part2': 'A married man bound by the rules of matrimony.',
                    'part3': 'He slipped out without alerting his ultimate boss — his wife.',
                    'part4': 'Your mission: Help him escape!',
                    'skip': 'SKIP'
                }
            },
            zh: {
                // Language selection
                'chooseLanguage': '选择语言',
                'english': 'English',
                'chinese': '中文',

                // Start screen
                'username': '用户名',
                'start': '开始',
                'leaderboard': '排行榜',
                'controls': '操作说明：',
                'tapToJump': '• 点击跳跃',
                'avoidObstacles': '• 避开障碍物，跑得越远越好！',

                // Game over screen
                'gameOver': '游戏结束',
                'groomSleeping': '新郎今晚睡沙发',
                'finalScore': '最终得分： ',
                'distance': '距离： ',
                'yourRank': '您的排名： ',
                'playAgain': '再玩一次',
                'mainMenu': '首页',

                // Storyline
                'storyline': {
                    'part1': '这是新郎。',
                    'part2': '一个受婚姻约束的已婚男人。',
                    'part3': '没告知妻子的情况下，他偷偷溜了出去。',
                    'part4': '你的任务：帮助他逃跑！',
                    'skip': '跳过'
                }
            }
        };

        this.init();
    }

    init() {
        // Load saved language preference
        const savedLanguage = localStorage.getItem('gameLanguage');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }

        // Set up event listeners
        this.setupEventListeners();

        // Apply initial language
        this.applyLanguage();
    }

    setupEventListeners() {
        // Language selection buttons
        const selectEnglish = document.getElementById('selectEnglish');
        const selectChinese = document.getElementById('selectChinese');
        const languageToggle = document.getElementById('languageToggle');

        if (selectEnglish) {
            selectEnglish.addEventListener('click', () => this.setLanguage('en'));
        }

        if (selectChinese) {
            selectChinese.addEventListener('click', () => this.setLanguage('zh'));
        }

        if (languageToggle) {
            languageToggle.addEventListener('click', () => this.toggleLanguage());
        }
    }

    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            localStorage.setItem('gameLanguage', language);
            this.applyLanguage();

            // Hide language selection screen and show start screen
            if (window.gameManager) {
                window.gameManager.showScreen('start');
            } else {
                // Fallback if gameManager not ready (shouldn't happen usually)
                const languageScreen = document.getElementById('languageScreen');
                const startScreen = document.getElementById('startScreen');

                if (languageScreen && startScreen) {
                    languageScreen.classList.remove('active');
                    startScreen.classList.add('active');
                }
            }

            // Hide loading screen if it's still showing
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.remove('active');
            }

            // Initialize the game manager if it hasn't been initialized yet
            if (!window.gameManager && typeof GameManager !== 'undefined') {
                console.log('Initializing GameManager after language selection');
                window.gameManager = new GameManager();
                // CRITICAL FIX: Unlock audio immediately using THIS user interaction event
                if (window.gameManager.audioManager) {
                    window.gameManager.audioManager.unlockAudio();
                }
            } else if (!window.gameManager) {
                console.log('GameManager class not available yet, will be initialized when game.js loads');
            } else if (window.gameManager && window.gameManager.audioManager) {
                // If game manager already exists, still try to unlock!
                window.gameManager.audioManager.unlockAudio();
            }
        }
    }

    toggleLanguage() {
        const newLanguage = this.currentLanguage === 'en' ? 'zh' : 'en';
        this.setLanguage(newLanguage);
    }

    applyLanguage() {
        // Update all elements with data attributes
        const elements = document.querySelectorAll('[data-en], [data-zh]');
        elements.forEach(element => {
            const translation = element.getAttribute(`data-${this.currentLanguage}`);
            if (translation) {
                // Check if element has child elements (like spans with IDs) that need to be preserved
                const originalHTML = element.innerHTML;
                const childSpans = element.querySelectorAll('span[id]');

                if (childSpans.length > 0) {
                    // Preserve the child span elements - replace only the text before the first span
                    // Find where the first span starts in the original HTML
                    const firstSpan = childSpans[0];
                    const firstSpanIndex = originalHTML.indexOf(firstSpan.outerHTML);

                    if (firstSpanIndex !== -1) {
                        // Get everything after the first span (including all spans and trailing text)
                        const contentAfterFirstSpan = originalHTML.substring(firstSpanIndex);
                        // Reconstruct with translation + everything after first span
                        element.innerHTML = translation + contentAfterFirstSpan;
                    } else {
                        // Fallback: preserve all spans manually
                        let newContent = translation;
                        childSpans.forEach(span => {
                            newContent += span.outerHTML;
                        });
                        // Try to preserve text after last span
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = originalHTML;
                        const lastSpan = tempDiv.querySelector('span:last-of-type');
                        if (lastSpan && lastSpan.nextSibling) {
                            newContent += lastSpan.nextSibling.textContent || '';
                        }
                        element.innerHTML = newContent;
                    }
                } else {
                    // No child elements to preserve, safe to use textContent
                    element.textContent = translation;
                }
            }
        });

        // Update placeholder text
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            const placeholder = this.translations[this.currentLanguage]['username'];
            usernameInput.placeholder = placeholder;
        }

        // Update language toggle button
        const languageToggle = document.getElementById('languageToggle');
        if (languageToggle) {
            languageToggle.textContent = this.currentLanguage === 'en' ? '中' : 'EN';
        }
    }

    getTranslation(key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return translation;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});
