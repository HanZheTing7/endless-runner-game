# Deployment Guide

## GitHub Pages (Free)

1. **Create Repository**
   - Go to GitHub.com and create a new repository
   - Name it something like "endless-runner-game"

2. **Upload Files**
   - Upload all project files to the repository
   - Or clone and push from your local machine

3. **Enable Pages**
   - Go to repository Settings
   - Click "Pages" in the left sidebar
   - Select source branch (usually `main`)
   - Click Save

4. **Access Your Game**
   - Your game will be available at: `https://username.github.io/repository-name`
   - It may take a few minutes to deploy

## Netlify (Free)

1. **Go to Netlify**
   - Visit netlify.com
   - Click "Sign up" or "Log in"

2. **Deploy Site**
   - Drag and drop your project folder to the deploy area
   - Or click "Deploy manually"

3. **Get URL**
   - Netlify will give you a random URL
   - You can customize it in Site Settings

## Vercel (Free)

1. **Go to Vercel**
   - Visit vercel.com
   - Sign up with GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Click Deploy

3. **Access Game**
   - Vercel will automatically deploy
   - Get a custom URL instantly

## Firebase Setup (Optional)

1. **Create Project**
   - Go to console.firebase.google.com
   - Create new project

2. **Enable Database**
   - Click "Realtime Database"
   - Click "Create Database"
   - Choose location and start in test mode

3. **Update Config**
   - Copy your project config
   - Replace values in `firebase-config.js`

4. **Set Rules**
   ```json
   {
     "rules": {
       "scores": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

## Testing

- Test on different devices
- Check mobile responsiveness
- Verify all controls work
- Test leaderboard functionality

## Common Issues

- **CORS errors**: Make sure all files are served from same domain
- **Firebase errors**: Check configuration and database rules
- **Mobile issues**: Test touch controls and responsive design
