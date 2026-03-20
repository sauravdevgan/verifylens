import os

files = [
    r"c:\Users\Asus user\OneDrive\Desktop\project\app\frontend\src\App.js",
    r"c:\Users\Asus user\OneDrive\Desktop\project\app\frontend\src\components\Header.js"
]

for f in files:
    with open(f, "r", encoding="utf-8") as file:
        lines = file.readlines()
    
    # Remove the first quote on line 0
    if lines and lines[0].startswith('"'):
        lines[0] = lines[0][1:]
    
    # Remove the last quote on the very last line
    if lines and lines[-1].strip() == '"':
        lines[-1] = lines[-1].replace('"', '')
    elif lines and lines[-1].endswith('"'):
        lines[-1] = lines[-1][:-1]
        
    data = "".join(lines)
    data = data.replace('\\"', '"')
    
    with open(f, "w", encoding="utf-8") as file:
        file.write(data)
