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
                    'part1': 'In a galaxy far, far away...',
                    'part2': 'Keating and Jane were about to have the perfect wedding...',
                    'part3': 'But suddenly, space pirates attacked!',
                    'part4': 'Now Keating must run through the stars to save his bride!',
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
                'mainMenu': '主菜单',
                
                // Storyline
                'storyline': {
                    'part1': '认识黄秀杰。',
                    'part2': '一个被婚姻规则束缚的已婚男人。',
                    'part3': '他偷偷溜出去，没有通知他的终极老板——他的妻子。',
                    'part4': '你的任务：帮助他逃脱！',
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
            const languageScreen = document.getElementById('languageScreen');
            const startScreen = document.getElementById('startScreen');
            
            if (languageScreen && startScreen) {
                languageScreen.classList.remove('active');
                startScreen.classList.add('active');
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
                element.textContent = translation;
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
