import base64
import os

def image_to_base64(path):
    mime_type = "image/jpeg" if path.lower().endswith(('.jpg', '.jpeg')) else "image/png"
    with open(path, "rb") as image_file:
        return f"data:{mime_type};base64," + base64.b64encode(image_file.read()).decode('utf-8')

assets = {}
files = {
    "head": "c:/Endless Runner/sk-head.png",
    "headJump": "c:/Endless Runner/sk_jump.png",
    "wifeHead": "c:/Endless Runner/jane.png",
    "smallDog": "c:/Endless Runner/sk_dog.png",
    "bigDog": "c:/Endless Runner/bigdog.jpg"
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
