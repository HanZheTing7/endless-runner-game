const QRCode = require('qrcode');
const fs = require('fs');

const gameUrl = 'https://www.keatingjaneforever.site/';

async function generateGoldQR() {
    try {
        console.log('Generating gold aesthetic QR code...');
        
        // Create canvas for the aesthetic version
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(800, 800);
        const ctx = canvas.getContext('2d');
        
        // Create gold gradient background
        const gradient = ctx.createRadialGradient(400, 400, 0, 400, 400, 400);
        gradient.addColorStop(0, '#FFD700');      // Bright gold
        gradient.addColorStop(0.3, '#FFA500');    // Orange gold
        gradient.addColorStop(0.6, '#DAA520');    // Goldenrod
        gradient.addColorStop(1, '#B8860B');      // Dark goldenrod
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 800);
        
        // Generate QR code
        await QRCode.toCanvas(canvas, gameUrl, {
            width: 800,
            margin: 3,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
        });
        
        // Add subtle gold overlay
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(0, 0, 800, 800);
        
        // Add "SCAN ME" badge with gold theme
        ctx.fillStyle = 'rgba(184, 134, 11, 0.95)';  // Dark goldenrod
        ctx.fillRect(650, 150, 120, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN ME', 710, 180);
        
        // Add game title in gold
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';  // Bright gold
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KeatingJaneForever', 400, 750);
        
        // Add some gold sparkles
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(150, 150, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(650, 300, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(200, 600, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Save as PNG
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync('keatingjaneforever-gold-qr.png', buffer);
        
        console.log('✅ Gold aesthetic QR code saved as: keatingjaneforever-gold-qr.png');
        console.log('📱 QR Code links to:', gameUrl);
        console.log('✨ Features: Gold gradient background with sparkles');
        
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
    }
}

generateGoldQR();
