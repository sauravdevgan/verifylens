with open("public/index.html", "r", encoding="utf-8") as f:
    text = f.read()
text = text.replace('\\"', '"')
with open("public/index.html", "w", encoding="utf-8") as f:
    f.write(text)
