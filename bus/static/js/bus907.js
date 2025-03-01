let busDataCache = [];
let currentTab = 'all';
let updateInterval;

// 切換分頁
function switchTab(tab) {
    currentTab = tab;
    // 更新按鈕樣式
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
    // 重新渲染資料
    renderBusData(busDataCache);
}

// 過濾公車資料
function filterBusData(data) {
    switch(currentTab) {
        case 'to-xizhi':
            return data.filter(bus => bus.direction === "往汐止");
        case 'to-wanhua':
            return data.filter(bus => bus.direction === "往萬華");
        default:
            return data;
    }
}

// 格式化時間
function formatTime(timeString) {
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 渲染公車資料
function renderBusData(busData) {
    const container = document.getElementById('bus-container');
    
    if (!Array.isArray(busData)) {
        console.error('Invalid bus data format:', busData);
        container.innerHTML = '<div class="error-message">資料格式錯誤</div>';
        return;
    }
    
    const filteredData = filterBusData(busData);
    
    if (filteredData.length === 0) {
        container.innerHTML = '<div class="no-data">目前無車輛行駛中</div>';
        return;
    }

    container.innerHTML = filteredData.map(bus => {
        if (!bus || typeof bus !== 'object') {
            console.error('Invalid bus object:', bus);
            return '';
        }

        return `
            <div class="bus-card ${bus.direction === '往汐止' ? 'to-xizhi' : 'to-wanhua'}">
                <div class="bus-header">
                    <h2>${bus.plate_numb || '未知車號'}</h2>
                    <span class="direction">${bus.direction || '未知方向'}</span>
                </div>
                <div class="bus-info">
                    <p class="station">目前站點: ${bus.station || '未知站點'}</p>
                    <p class="status">營運狀態: ${bus.duty_status || '未知狀態'}</p>
                    <p class="bus-status">車輛狀態: ${bus.bus_status || '未知狀態'}</p>
                    <p class="gps-time">GPS更新: ${bus.gps_time ? formatTime(bus.gps_time) : '無資料'}</p>
                </div>
            </div>
        `;
    }).filter(html => html).join('');
}

// 更新公車資料
function updateBusData() {
    axios.get('/api/bus-data/907')
        .then(function (response) {
            if (!response.data) {
                throw new Error('No data received');
            }
            
            busDataCache = response.data;
            const updateTime = document.getElementById('update-time');
            
            if (Array.isArray(busDataCache) && busDataCache.length > 0) {
                const lastUpdate = new Date(busDataCache[0].update_time || Date.now());
                updateTime.textContent = `更新時間: ${lastUpdate.toLocaleTimeString()}`;
                renderBusData(busDataCache);
            } else {
                console.error('Invalid data format:', busDataCache);
                document.getElementById('bus-container').innerHTML = 
                    '<div class="error-message">資料格式錯誤</div>';
            }
        })
        .catch(function (error) {
            console.error('Error:', error);
            document.getElementById('bus-container').innerHTML = 
                '<div class="error-message">資料載入失敗，請稍後再試</div>';
        });
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
    
    updateBusData();
    window.updateInterval = setInterval(updateBusData, 30000);
});

// 頁面離開時清理
window.addEventListener('beforeunload', function() {
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
});