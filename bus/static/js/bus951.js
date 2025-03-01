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
        case 'to-xindian':
            return data.filter(bus => bus.direction === "往新店");
        default:
            return data;
    }
}

// 渲染公車資料
function renderBusData(busData) {
    const container = document.getElementById('bus-container');
    const filteredData = filterBusData(busData);
    
    if (filteredData.length === 0) {
        container.innerHTML = '<div class="no-data">目前無車輛行駛中</div>';
        return;
    }

    container.innerHTML = filteredData.map(bus => `
        <div class="bus-card ${bus.direction === '往汐止' ? 'to-xizhi' : 'to-xindian'}">
            <div class="bus-header">
                <h2>${bus.plate_numb}</h2>
                <span class="direction">${bus.direction}</span>
            </div>
            <div class="bus-info">
                <p class="station">目前站點: ${bus.station}</p>
                <p class="status">營運狀態: ${bus.duty_status}</p>
                <p class="bus-status">車輛狀態: ${bus.bus_status}</p>
                <p class="gps-time">GPS更新: ${formatTime(bus.gps_time)}</p>
            </div>
        </div>
    `).join('');
}

// 格式化時間
function formatTime(timeString) {
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 更新公車資料
function updateBusData() {
    axios.get('/api/bus-data/951')
        .then(function (response) {
            busDataCache = response.data;
            const updateTime = document.getElementById('update-time');
            
            if (busDataCache.length > 0) {
                const lastUpdate = new Date(busDataCache[0].update_time);
                updateTime.textContent = `更新時間: ${lastUpdate.toLocaleTimeString()}`;
                renderBusData(busDataCache);
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
    updateBusData();
    // 每30秒更新一次資料
    setInterval(updateBusData, 30000);
});


// 更新公車資料
function updateBusData() {
    axios.get('/api/bus-data/951')
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
    // 清除可能存在的舊定時器
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
    
    // 立即更新一次資料
    updateBusData();
    
    // 設定新的定時器並保存引用
    window.updateInterval = setInterval(updateBusData, 30000);
});

// 頁面離開時清理
window.addEventListener('beforeunload', function() {
    if (window.updateInterval) {
        clearInterval(window.updateInterval);
    }
});