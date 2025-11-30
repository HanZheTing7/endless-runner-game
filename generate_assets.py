import base64
import os

def image_to_base64(path):
    with open(path, "rb") as image_file:
        return "data:image/png;base64," + base64.b64encode(image_file.read()).decode('utf-8')

assets = {}
files = {
    "head": "c:/Endless Runner/sk-head.png",
    "headJump": "c:/Endless Runner/sk_jump.png",
    "wifeHead": "c:/Endless Runner/jane.png"
}

print("Generating assets.js...")
js_content = "const ASSETS = {\n"

for key, path in files.items():
    if os.path.exists(path):
        print(f"Encoding {path}...")
        b64 = image_to_base64(path)
        js_content += f'    {key}: "{b64}",\n'
    else:
        print(f"Warning: {path} not found!")

js_content += "};\n"

with open("c:/Endless Runner/assets.js", "w") as f:
    f.write(js_content)

print("Done! assets.js created.")
