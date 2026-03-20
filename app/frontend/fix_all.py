import os
import sys

directory = r"c:\Users\Asus user\OneDrive\Desktop\project\app\frontend\src"

for root, _, files in os.walk(directory):
    for f in files:
        if f.endswith((".js", ".jsx", ".css")):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                lines = file.readlines()
            
            changed = False
            if lines and lines[0].startswith('"'):
                lines[0] = lines[0][1:]
                changed = True
            
            if lines and lines[-1].strip() == '"':
                lines[-1] = lines[-1].replace('"', '')
                changed = True
            elif lines and lines[-1].endswith('"\n'):
                lines[-1] = lines[-1][:-2] + '\n'
                changed = True
            elif lines and lines[-1].endswith('"'):
                lines[-1] = lines[-1][:-1]
                changed = True
                
            data = "".join(lines)
            if '\\"' in data:
                data = data.replace('\\"', '"')
                changed = True
                
            if changed:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(data)
                print(f"Fixed {path}")
