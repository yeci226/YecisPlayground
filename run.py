from flask import Flask, jsonify, request, render_template

port = 5000
app = Flask(__name__, template_folder='app/templates')
app.static_folder = 'app/static'

@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, port=port)
    print(f"Server is running on port {port}")
