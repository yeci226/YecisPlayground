import time
import traceback
import requests
from flask import Flask, request, jsonify
from urllib.parse import urlparse, parse_qs
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def sleep(ms):
    time.sleep(ms / 1000)

def fetch_warp_data(query, id, end_id):
    try:
        query['gacha_type'] = id
        query['end_id'] = end_id

        response = requests.get(
            "https://public-operation-hkrpg-sg.hoyoverse.com/common/gacha_record/api/getGachaLog",
            params=query,
            timeout=10  # Add timeout to prevent hanging
        )
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.RequestException as e:
        print(f"Request Error: {e}")
        return {'error': 'request_failed', 'message': str(e)}

def get_warp_log(input_url):
    try:
        takumi_query = {
            'authkey_ver': 1,
            'sign_type': 2,
            'game_biz': 'hkrpg_global',
            'lang': 'en',
            'authkey': '',
            'region': '',
            'gacha_type': 0,
            'size': 20,
            'end_id': 0,
        }

        # Parse the input URL and get query parameters
        parsed_url = urlparse(input_url)
        query_params = parse_qs(parsed_url.query)
        
        # Extract parameters with default values
        authkey = query_params.get('authkey', [''])[0]
        region = query_params.get('region', [''])[0]
        last_id = query_params.get('end_id', ['0'])[0]
        
        gacha_types = {'character': 11, 'light_cone': 12, 'regular': 1}

        if not authkey:
            return {'error': 'no_authkey', 'message': 'No authentication key provided'}

        query = takumi_query.copy()
        query['authkey'] = authkey
        warps = []

        for gacha_type, id in gacha_types.items():
            result = fetch_warp_data(query, id, 0)

            if result.get('error'):
                return result

            if result['retcode'] != 0:
                return {'error': result['retcode'], 'message': result.get('message', 'Unknown error')}

            if not region:
                region = result['region']
            query['region'] = region

            last_id = 0
            temp_warps = []

            while True:
                warp_data = fetch_warp_data(query, id, last_id)

                if warp_data.get('error'):
                    return warp_data

                if warp_data and warp_data.get('data'):
                    list_length = len(warp_data['data']['list']) - 1
                    if list_length < 0:
                        break

                    for warp in warp_data['data']['list']:
                        if str(warp['id']) == str(last_id):
                            break
                        temp_warps.append({
                            'id': warp['item_id'],
                            'name': warp['name'].lower().replace(' ', '_'),
                            'type': warp['item_type'].lower().replace(' ', '_'),
                            'time': warp['time'],
                            'rank': warp['rank_type'],
                        })

                    last_id = warp_data['data']['list'][list_length]['id']
                    time.sleep(0.55)
                else:
                    break

            warps.append({
                'type': gacha_type,
                'size': len(temp_warps),
                'data': temp_warps,
            })

        # Rest of the existing processing logic remains the same...
        list_result = {
            'character': {'total': 0, 'average': 0, 'pity': 0, 'data': []},
            'light_cone': {'total': 0, 'average': 0, 'pity': 0, 'data': []},
            'regular': {'total': 0, 'average': 0, 'pity': 0, 'data': []},
        }

        for warp in warps:
            warp_type = warp['type']
            warp_data = warp['data']
            total = 0
            count = 0

            grouped_records = []
            current_group = []

            for index in reversed(warp_data):
                total += 1
                record_entry = {
                    'id': index['id'],
                    'type': index['type'],
                    'name': index['name'],
                    'time': index['time'],
                    'rank': index['rank'],
                    'icon': f"https://raw.githubusercontent.com/Mar-7th/StarRailRes/refs/heads/master/icon/{index['type']}/{index['id']}.png",
                    'count': count + 1,
                }

                count = 0 if index['rank'] == "5" else count + 1
                current_group.append(record_entry)

                if index['rank'] == "5":
                    if current_group:
                        grouped_records.append(list(reversed(current_group)))
                        current_group = []

            if current_group:
                grouped_records.append(current_group)

            grouped_records[-1] = list(reversed(grouped_records[-1]))
            list_result[warp_type]['data'] = grouped_records

            data = list_result[warp_type]['data']
            data.reverse()
            list_result[warp_type]['pity'] = count
            list_result[warp_type]['average'] = remove_trailing_zeros(
                f"{calculate_average_count(data):.2f}"
            )
            list_result[warp_type]['total'] = total

        return list_result

    except Exception as e:
        print(f"Unexpected Error: {e}")
        print(traceback.format_exc())
        return {
            'error': 'unexpected_error', 
            'message': 'An unexpected error occurred while processing the warp log',
            'details': str(e)
        }

def remove_trailing_zeros(num):
    return num.rstrip('0').rstrip('.') if '.' in num else num

def calculate_average_count(data):
    if len(data) <= 1:
        return 0
    
    total = sum(len(group) for group in data[1:])
    return total / (len(data) - 1)

@app.route('/api/hsr/warp-log', methods=['POST'])
def warp_log_handler():
    try:
        log_url = request.json.get('logUrl')
        if not log_url:
            return jsonify({'error': 'no_log_url', 'message': 'No log URL provided'}), 400
        
        warp_results = get_warp_log(log_url)
        
        # Check if the result contains an error
        if isinstance(warp_results, dict) and warp_results.get('error'):
            return jsonify(warp_results), 500
        
        return jsonify(warp_results)

    except Exception as e:
        print(f"Route Handler Error: {e}")
        print(traceback.format_exc())
        return jsonify({
            'error': 'route_handler_error', 
            'message': 'An error occurred while processing the request',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)