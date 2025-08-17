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
        async saveScore(username, score, distance, browserId) {
            try {
                const scoreData = {
                    username: username,
                    score: score,
                    distance: distance,
                    browserId: browserId,
                    timestamp: Date.now()
                };
                
                await database.ref('scores').push(scoreData);
                return true;
            } catch (error) {
                console.error('Error saving score:', error);
                return false;
            }
        },

        // Get top scores from leaderboard (deduplicated by username)
        async getTopScores(limit = 10) {
            try {
                const snapshot = await database.ref('scores')
                    .once('value');
                
                const scores = [];
                snapshot.forEach((childSnapshot) => {
                    scores.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                
                // Create a map to keep only the highest score for each username
                const uniqueScores = new Map();
                
                scores.forEach(score => {
                    if (!uniqueScores.has(score.username) || 
                        score.score > uniqueScores.get(score.username).score) {
                        uniqueScores.set(score.username, score);
                    }
                });
                
                // Convert back to array, sort by score (highest first), and return top scores
                return Array.from(uniqueScores.values())
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
            } catch (error) {
                console.error('Error getting scores:', error);
                return [];
            }
        },

        // Check if username already exists (considering browser ID)
        async checkUsernameExists(username, browserId) {
            try {
                const snapshot = await database.ref('scores')
                    .orderByChild('username')
                    .equalTo(username)
                    .once('value');
                
                if (!snapshot.exists()) {
                    return false; // Username doesn't exist at all
                }
                
                // Check if any of the existing usernames have the same browser ID
                let sameUserExists = false;
                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    if (data.browserId === browserId) {
                        sameUserExists = true;
                    }
                });
                
                // If same user (browser ID) exists, allow it. If different user, block it.
                return !sameUserExists;
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
        },

        // Clear all scores from leaderboard
        async clearAllScores() {
            try {
                await database.ref('scores').remove();
                console.log('All scores cleared from Firebase');
                return true;
            } catch (error) {
                console.error('Error clearing scores from Firebase:', error);
                return false;
            }
        }
    };
} catch (error) {
    console.warn('Firebase not configured or failed to initialize. Using offline mode.');
    
    // Offline fallback with local storage
    FirebaseHelper = {
        async saveScore(username, score, distance, browserId) {
            try {
                const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                scores.push({
                    id: Date.now().toString(),
                    username: username,
                    score: score,
                    distance: distance,
                    browserId: browserId,
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
                
                // Create a map to keep only the highest score for each username
                const uniqueScores = new Map();
                
                scores.forEach(score => {
                    if (!uniqueScores.has(score.username) || 
                        score.score > uniqueScores.get(score.username).score) {
                        uniqueScores.set(score.username, score);
                    }
                });
                
                // Convert back to array, sort by score (highest first), and return top scores
                return Array.from(uniqueScores.values())
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit);
            } catch (error) {
                console.error('Error getting local scores:', error);
                return [];
            }
        },

        async checkUsernameExists(username, browserId) {
            try {
                const scores = JSON.parse(localStorage.getItem('endlessRunnerScores') || '[]');
                
                // Find all scores with this username
                const userScores = scores.filter(score => score.username === username);
                
                if (userScores.length === 0) {
                    return false; // Username doesn't exist at all
                }
                
                // Check if any of the existing usernames have the same browser ID
                const sameUserExists = userScores.some(score => score.browserId === browserId);
                
                // If same user (browser ID) exists, allow it. If different user, block it.
                return !sameUserExists;
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
        },

        async clearAllScores() {
            try {
                localStorage.removeItem('endlessRunnerScores');
                console.log('All scores cleared from localStorage');
                return true;
            } catch (error) {
                console.error('Error clearing local scores:', error);
                return false;
            }
        }
    };
}

// Export for use in game.js
window.FirebaseHelper = FirebaseHelper;
