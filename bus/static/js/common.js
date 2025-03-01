function updateBusData(route) {
    axios.get(`/api/bus-data/${route}`)
        .then(function (response) {
            busDataCache = response.data;
            renderBusData(busDataCache);
            updateTime();
        })
        .catch(function (error) {
            console.error('Error:', error);
        });
}

function updateTime() {
    const updateTime = document.getElementById('update-time');
    if (busDataCache.length > 0) {
        updateTime.textContent = `更新時間: ${busDataCache[0].update_time}`;
    }
}