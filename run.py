from flask import Flask, request, jsonify
import requests
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/videoTitle', methods=['GET'])
def get_video_title():
    video_url = request.args.get('url')
    if not video_url:
        return jsonify({'error': 'URL is required'}), 400

    try:
        response = requests.get(video_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch video page'}), 500

        title_match = re.search(r'<title>(.*?)</title>', response.text)
        if title_match and len(title_match.groups()) > 0:
            title = title_match.group(1).replace(' - YouTube', '').strip()
            return jsonify({'title': title}), 200
        else:
            return jsonify({'error': 'Title not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)