from flask import Flask, render_template, jsonify
import requests
import json
from datetime import datetime

app = Flask(__name__)

class Auth():
    def __init__(self, app_id, app_key):
        self.app_id = app_id
        self.app_key = app_key

    def get_auth_header(self):
        content_type = 'application/x-www-form-urlencoded'
        grant_type = 'client_credentials'

        return{
            'content-type': content_type,
            'grant_type': grant_type,
            'client_id': self.app_id,
            'client_secret': self.app_key
        }

class Data():
    def __init__(self, app_id, app_key, auth_response):
        self.app_id = app_id
        self.app_key = app_key
        self.auth_response = auth_response

    def get_data_header(self):
        auth_JSON = json.loads(self.auth_response.text)
        access_token = auth_JSON.get('access_token')

        return{
            'authorization': 'Bearer ' + access_token,
            'Accept-Encoding': 'gzip'
        }

class BusFormatter:
    @staticmethod
    def format_bus_status(status):
        status_map = {
            0: "正常營運",
            1: "車輛故障",
            2: "車輛調度中",
            3: "休息中"
        }
        return status_map.get(status, "未知狀態")

    @staticmethod
    def format_duty_status(status):
        status_map = {
            0: "正常",
            1: "工作中",
            2: "未營運"
        }
        return status_map.get(status, "未知狀態")

    @staticmethod
    def format_direction(direction,route):
        if route == '951':
            return "往汐止" if direction == 1 else "往新店"
        elif route == '907':
            return "往汐止" if direction == 1 else "往萬華"
        elif route == '藍15':
            return "往汐止" if direction == 1 else "往捷運昆陽站"

def get_bus_data(route):
    app_id = '111703037-5a69f0bb-4111-48a6'
    app_key = '5d961966-52e8-41e4-9b0c-9c480ad7e34e'
    auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
    # 根據不同路線設定相應的API URL
    route_urls = {
        '951': "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeNearStop/City/NewTaipei/951?%24top=30&%24format=JSON",
        '907': "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeNearStop/City/Taipei/907?%24top=30&%24format=JSON",
        '藍15': "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeNearStop/City/NewTaipei/%E8%97%8D15?%24top=30&%24format=JSON"
    }
    
    url = route_urls.get(route, '')
    if not url:
        return []
    try:
        # 取得認證
        auth = Auth(app_id, app_key)
        auth_response = requests.post(auth_url, auth.get_auth_header())
        
        # 取得公車資料
        data = Data(app_id, app_key, auth_response)
        bus_response = requests.get(url, headers=data.get_data_header())
        
        # 格式化資料
        bus_data = json.loads(bus_response.text)
        formatted_data = []
        
        for bus in bus_data:
            formatted_bus = {
                'plate_numb': bus['PlateNumb'],
                'route': bus['RouteName']['Zh_tw'],
                'direction': BusFormatter.format_direction(bus['Direction'],bus['RouteName']['Zh_tw']),
                'station': bus['StopName']['Zh_tw'],
                'duty_status': BusFormatter.format_duty_status(bus['DutyStatus']),
                'bus_status': BusFormatter.format_bus_status(bus['BusStatus']) if 'BusStatus' in bus else "未知",
                'gps_time': bus['GPSTime'],
                'update_time': bus['UpdateTime']
            }
            formatted_data.append(formatted_bus)
            
        return formatted_data
    except Exception as e:
        print(f"Error: {str(e)}")
        return []
    

def get_bus_position_data(route):
    """取得公車即時位置資料"""
    app_id = '111703037-5a69f0bb-4111-48a6'
    app_key = '5d961966-52e8-41e4-9b0c-9c480ad7e34e'
    auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
    
    # 根據不同路線設定相應的API URL (使用即時位置API)
    route_urls = {
        '951': "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/NewTaipei/951?%24top=30&%24format=JSON",
        '907': "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/Taipei/907?%24top=30&%24format=JSON",
        '藍15': "https://tdx.transportdata.tw/api/basic/v2/Bus/RealTimeByFrequency/City/NewTaipei/%E8%97%8D15?%24top=30&%24format=JSON"
    }
    
    url = route_urls.get(route)
    if not url:
        print(f"找不到路線: {route}")
        return []

    # 取得認證
    auth = Auth(app_id, app_key)
    auth_response = requests.post(auth_url, auth.get_auth_header())
    
    # 取得公車資料
    data = Data(app_id, app_key, auth_response)
    bus_response = requests.get(url, headers=data.get_data_header())

    # 解析JSON資料
    bus_data = json.loads(bus_response.text)
    formatted_data = []
    for bus in bus_data:
        try:
            formatted_bus = {
                'plate_numb': bus.get('PlateNumb', '未知'),
                'route': bus.get('RouteName', {}).get('Zh_tw', '未知'),
                'subroute': bus.get('SubRouteName', {}).get('Zh_tw', '未知'),
                'direction': BusFormatter.format_direction(
                    bus.get('Direction', 0),
                    bus.get('RouteName', {}).get('Zh_tw', '未知')
                ),
                'position': {
                    'lat': float(bus.get('BusPosition', {}).get('PositionLat', 0)),
                    'lon': float(bus.get('BusPosition', {}).get('PositionLon', 0)),
                    'geo_hash': bus.get('BusPosition', {}).get('GeoHash', '')
                },
                'status': {
                    'speed': float(bus.get('Speed', 0)),
                    'azimuth': float(bus.get('Azimuth', 0)),
                    'duty_status': BusFormatter.format_duty_status(bus.get('DutyStatus', 0)),
                    'bus_status': BusFormatter.format_bus_status(bus.get('BusStatus', 0))
                },
                'time': {
                    'gps_time': bus.get('GPSTime', ''),
                    'src_update_time': bus.get('SrcUpdateTime', ''),
                    'update_time': bus.get('UpdateTime', '')
                },
                'operator': {
                    'id': bus.get('OperatorID', ''),
                    'no': bus.get('OperatorNo', '')
                }
            }
            formatted_data.append(formatted_bus)
        except Exception as e:
            print(f"處理公車資料時發生錯誤: {str(e)}")
            print(f"問題資料: {bus}")
            continue
        
    return formatted_data



@app.route('/')
def index():
    return render_template('index.html')


@app.route('/bus951')
def bus951():
    return render_template('bus951.html')

@app.route('/bus907')
def bus907():
    return render_template('bus907.html')

@app.route('/blue15')
def blue15():
    return render_template('busbl15.html')

@app.route('/bus951/position')
def bus951_position():
    return render_template('bus951_position.html')

# 更新路由以使用新的函式
@app.route('/api/bus-position/<route>')
def api_bus_position(route):
    try:
        bus_data = get_bus_position_data(route)
        return jsonify(bus_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API路由
@app.route('/api/bus-data/<route>')
def api_bus_data(route):
    bus_data = get_bus_data(route)
    return jsonify(bus_data)

if __name__ == '__main__':
    app.run(port = 3000, debug=True)