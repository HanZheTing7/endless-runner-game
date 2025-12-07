const fs = require('fs');
const path = require('path');

const files = {
    "head": "sk-head.png",
    "headJump": "sk_jump.png",
    "wifeHead": "jane.png",
    "smallDog": "sk_dog.png",
    "bigDog": "bigdog.jpg",
    "dogOne": "dogone.jpg",
    "dogTwo": "dogtwo.jpg"
};

let jsContent = "const ASSETS = {\n";

for (const [key, fileName] of Object.entries(files)) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        console.log(`Encoding ${fileName}...`);
        const fileData = fs.readFileSync(filePath);
        const ext = path.extname(fileName).toLowerCase();
        let mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') {
            mimeType = 'image/jpeg';
        }
        const b64 = `data:${mimeType};base64,${fileData.toString('base64')}`;
        jsContent += `    ${key}: "${b64}",\n`;
    } else {
        console.warn(`Warning: ${fileName} not found!`);
        // If file not found, we might want to keep the old value if we were parsing assets.js, 
        // but here we are regenerating it. If source is missing, we can't bundle it. 
        // Ideally we should fail or ensure files exist.
    }
}

jsContent += "};\n";

fs.writeFileSync(path.join(__dirname, 'assets.js'), jsContent);
console.log("Done! assets.js created.");
