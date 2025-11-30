const fs = require('fs');
const path = require('path');

const files = {
    head: "c:/Endless Runner/sk-head.png",
    headJump: "c:/Endless Runner/sk_jump.png",
    wifeHead: "c:/Endless Runner/jane.png"
};

console.log("Generating assets.js...");
let jsContent = "const ASSETS = {\n";

for (const [key, filePath] of Object.entries(files)) {
    if (fs.existsSync(filePath)) {
        console.log(`Encoding ${filePath}...`);
        const bitmap = fs.readFileSync(filePath);
        const base64 = Buffer.from(bitmap).toString('base64');
        jsContent += `    ${key}: "data:image/png;base64,${base64}",\n`;
    } else {
        console.warn(`Warning: ${filePath} not found!`);
    }
}

jsContent += "};\n";

fs.writeFileSync("c:/Endless Runner/assets.js", jsContent);
console.log("Done! assets.js created.");
