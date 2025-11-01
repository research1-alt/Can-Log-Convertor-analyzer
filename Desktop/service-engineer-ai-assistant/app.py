from flask import Flask, render_template, request
import os
import requests

app = Flask(__name__)

# Folder to save uploaded files
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Environment variable for Gemini API
API_KEY = os.environ.get("AIzaSyCEpYPcguichBulXSBpCpgvgioQ3Ns5oG0")
GEMINI_API_URL = "https://ai.studio/apps/drive/1hR-8zLGj10VUZK5e6rr70_t2ygnDRX-e"

# Admin route to upload files
@app.route("/admin", methods=["GET", "POST"])
def admin():
    message = ""
    if request.method == "POST":
        file = request.files.get("source_file")
        if file:
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            message = f"File {file.filename} uploaded successfully!"
    return render_template("admin.html", message=message)

# User route to ask queries
@app.route("/", methods=["GET", "POST"])
def home():
    user_message = ""
    bot_response = ""
    if request.method == "POST":
        user_message = request.form.get("user_message")
        try:
            headers = {"Authorization": f"Bearer {API_KEY}"}
            data = {"message": user_message}
            response = requests.post(GEMINI_API_URL, json=data, headers=headers)
            bot_response = response.json().get("response")
        except Exception as e:
            bot_response = f"Error connecting to Gemini API: {str(e)}"

    return render_template("index.html", user_message=user_message, bot_response=bot_response)

if __name__ == "__main__":
    app.run(debug=True)
