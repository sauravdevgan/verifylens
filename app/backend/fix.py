import sys
file_path = "server.py"
with open(file_path, "r", encoding="utf-8") as f:
    data = f.read()
data = data.replace('\\"', '"')
data = data.replace('\\n', '\n') # Maybe newlines are escaped too?
with open(file_path, "w", encoding="utf-8") as f:
    f.write(data)
