from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

@app.route('/api/videoTitle', methods=['GET'])
def get_video_title():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    
    try:
        ydl_opts = {
            'format': 'best',
            'quiet': True,
            'extract_flat': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if 'entries' in info: 
                title = info.get('title', 'No title found')
                thumbnail_url = ''
                song_count = len(info['entries'])
                thumbnail_url = ''
                thumbnails = info.get('thumbnails', [])
                for thumbnail in thumbnails:
                    if thumbnail.get('preference') == 0:
                        thumbnail_url = thumbnail.get('url')
                        break

                return jsonify({
                    'playlist': True,
                    'title': title,
                    'songCount': song_count,
                    'thumbnail': thumbnail_url  # 返回縮略圖
                })
            else:
                title = info.get('title', 'No title found')
                thumbnail_url = ''
                thumbnails = info.get('thumbnails', [])
                for thumbnail in thumbnails:
                    if thumbnail.get('preference') == 0:
                        thumbnail_url = thumbnail.get('url')
                        break
                
                return jsonify({
                    'playlist': False,
                    'title': title,
                    'thumbnail': thumbnail_url  # 返回縮略圖
                })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=8080)