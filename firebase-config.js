// Firebase Configuration
// Replace with your own Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCENbPTYWm_I09550EK21hWWopj2Qiz5mA",
    authDomain: "endless-runner-b434b.firebaseapp.com",
    databaseURL: "https://endless-runner-b434b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "endless-runner-b434b",
    storageBucket: "endless-runner-b434b.firebasestorage.app",
    messagingSenderId: "571144626978",
    appId: "1:571144626978:web:6bd82089c9a0071a95fb7b",
    measurementId: "G-GVMPGT05ZJ"
  };
// Check if Firebase is properly configured
let database = null;
let FirebaseHelper = null;

try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Get database reference
    database = firebase.database();
    
    // Firebase Database Helper Functions
    FirebaseHelper = {
        // Save score to leaderboard
        async saveScore(username, score, distance) {
            try {
                const scoreData = {
                    username: username,
                    score: score,
                    distance: distance,
                    timestamp: Date.now()
                };
                
                await database.ref('scores').push(scoreData);
                return true;
            } catch (error) {
                console.error('Error saving score:', error);
                return false;
            }
        },

        // Get top scores from leaderboard
        async getTopScores(limit = 10) {
            try {
                const snapshot = await database.ref('scores')
                    .orderByChild('score')
                    .limitToLast(limit)
                    .once('value');
                
                const scores = [];
                snapshot.forEach((childSnapshot) => {
                    scores.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Sort by score (highest first) and return top scores
                return scores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
            } catch (error) {
                console.error('Error getting scores:', error);
                return [];
            }
        },

        // Check if username already exists
        async checkUsernameExists(username) {
            try {
                const snapshot = await database.ref('scores')
                    .orderByChild('username')
                    .equalTo(username)
                    .once('value');
                
                return snapshot.exists();
            } catch (error) {
                console.error('Error checking username:', error);
                return false;
            }
        },

        // Get player rank
        async getPlayerRank(score) {
            try {
                const snapshot = await database.ref('scores')
                    .orderByChild('score')
                    .once('value');
                
                let rank = 1;
                snapshot.forEach((childSnapshot) => {
                    if (childSnapshot.val().score > score) {
                        rank++;
                    }
                });
                
                return rank;
            } catch (error) {
                console.error('Error getting player rank:', error);
                return -1;
            }
        }
    };
} catch (error) {
    console.warn('Firebase not configured or failed to initialize. Using offline mode.');
    
    // Offline fallback with local storage
    FirebaseHelper = {
        async saveScore(username, score, distance) {
            try {
                const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                scores.push({
                    id: Date.now().toString(),
                    username: username,
                    score: score,
                    distance: distance,
                    timestamp: Date.now()
                });
                
                // Keep only top 100 scores to save space
                scores.sort((a, b) => b.score - a.score);
                if (scores.length > 100) {
                    scores.splice(100);
                }
                
                localStorage.setItem('endlessRunnerScores', JSON.stringify(scores));
                return true;
            } catch (error) {
                console.error('Error saving score locally:', error);
                return false;
            }
        },

        async getTopScores(limit = 10) {
            try {
                const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                return scores.slice(0, limit);
            } catch (error) {
                console.error('Error getting local scores:', error);
                return [];
            }
        },

        async checkUsernameExists(username) {
            try {
                const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                return scores.some(score => score.username === username);
            } catch (error) {
                console.error('Error checking local username:', error);
                return false;
            }
        },

        async getPlayerRank(score) {
            try {
                const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                let rank = 1;
                scores.forEach(scoreData => {
                    if (scoreData.score > score) {
                        rank++;
                    }
                });
                return rank;
            } catch (error) {
                console.error('Error getting local player rank:', error);
                return -1;
            }
        }
    };
}

// Export for use in game.js
window.FirebaseHelper = FirebaseHelper;
