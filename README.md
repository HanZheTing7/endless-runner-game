# Endless Runner Game

A mobile-friendly endless runner game built with HTML5, CSS, and JavaScript.

## Features
- Automatic running character
- Jump and slide mechanics
- Progressive difficulty
- Touch and keyboard controls
- Username system with duplicate prevention
- Global leaderboard (Firebase)
- Responsive design for mobile/desktop

## Quick Start
1. Open `index.html` in a web browser
2. Enter a unique username
3. Click START GAME
4. Use Space/Up to jump, Down/Shift to slide
5. Avoid obstacles and try to get the highest score!

## Setup Leaderboard (Optional)
1. Create Firebase project at console.firebase.google.com
2. Enable Realtime Database
3. Update `firebase-config.js` with your config
4. Set database rules to allow read/write

## Deploy to GitHub Pages (Free)
1. Create GitHub repository
2. Upload all files
3. Go to Settings > Pages
4. Select source branch
5. Game will be available at username.github.io/repo-name

## Deploy to Netlify (Free)
1. Go to netlify.com
2. Drag and drop project folder
3. Get instant deployment with custom URL

## Controls
- **Desktop**: Space/Up Arrow (Jump), Down Arrow/Shift (Slide)
- **Mobile**: Quick tap (Jump), Long swipe (Slide), On-screen buttons

## Files
- `index.html` - Main game structure
- `style.css` - Game styling and responsive design
- `game.js` - Game logic and mechanics
- `firebase-config.js` - Firebase configuration

## Customization
Edit CSS for colors/styling, modify game.js for mechanics, add custom graphics and sounds.

## Troubleshooting
- Check browser console for errors
- Ensure all files are in same directory
- Verify Firebase config if using leaderboard
- Test in different browsers

Enjoy playing! 🎮
