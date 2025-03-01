let map;
let busMarkers = {};
let updateInterval;

// 初始化地圖
function initMap() {
    console.log('Initializing map...');
    try {
        map = L.map('map').setView([24.977133, 121.546483], 13);
        console.log('Map object created');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        console.log('Tile layer added');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// ...existing code...

// 更新公車位置
function updateBusPosition() {
    axios.get('/api/bus-position/951')
        .then(function(response) {
            const buses = response.data;
            
            // 更新時間顯示
            if (buses.length > 0) {
                const lastUpdate = new Date(buses[0].time.update_time);
                document.getElementById('update-time').textContent = 
                    `更新時間: ${lastUpdate.toLocaleTimeString()}`;
            }

            // 更新車輛詳細資訊
            document.getElementById('bus-details').innerHTML = buses.map(bus => `
                <div class="bus-card ${bus.direction === '往新店' ? 'to-xindian' : 'to-xizhi'}">
                    <h3>車號: ${bus.plate_numb}</h3>
                    <div class="bus-info-basic">
                        <p>路線: ${bus.route}</p>
                        <p>子路線: ${bus.subroute}</p>
                        <p>方向: ${bus.direction}</p>
                    </div>
                    <div class="bus-info-status">
                        <p>車速: ${bus.status.speed} km/h</p>
                        <p>營運狀態: ${bus.status.duty_status}</p>
                        <p>車輛狀態: ${bus.status.bus_status}</p>
                    </div>
                    <div class="bus-info-time">
                        <p>GPS時間: ${new Date(bus.time.gps_time).toLocaleTimeString()}</p>
                        <p>更新時間: ${new Date(bus.time.update_time).toLocaleTimeString()}</p>
                    </div>
                </div>
            `).join('');

            // 更新地圖標記
            buses.forEach(bus => {
                const position = [bus.position.lat, bus.position.lon];
                
                if (busMarkers[bus.plate_numb]) {
                    busMarkers[bus.plate_numb].setLatLng(position);
                } else {
                    const marker = L.marker(position, {
                        title: bus.plate_numb
                    }).addTo(map);
                    
                    marker.bindPopup(`
                        <b>車號: ${bus.plate_numb}</b><br>
                        <b>子路線: ${bus.subroute}</b><br>
                        方向: ${bus.direction}<br>
                        速度: ${bus.status.speed} km/h<br>
                        狀態: ${bus.status.bus_status}<br>
                        GPS時間: ${new Date(bus.time.gps_time).toLocaleTimeString()}
                    `);
                    
                    busMarkers[bus.plate_numb] = marker;
                }
            });
        })
        .catch(function(error) {
            console.error('Error:', error);
            document.getElementById('bus-details').innerHTML = 
                '<div class="error-message">資料載入失敗，請稍後再試</div>';
        });
}

// ...existing code...

// 取得車輛狀態文字
function getBusStatusText(status) {
    const statusMap = {
        0: "正常營運",
        1: "車輛故障",
        2: "車輛調度中",
        3: "休息中"
    };
    return statusMap[status] || "未知狀態";
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化地圖
    initMap();
    
    // 立即更新一次資料
    updateBusPosition();
    
    // 設定定時更新
    updateInterval = setInterval(updateBusPosition, 30000);
});

// 頁面離開時清理
window.addEventListener('beforeunload', function() {
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
});