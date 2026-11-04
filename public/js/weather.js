/**
 * FarmFusion Web – Weather Module Logic
 * Interfaces with Open-Meteo API endpoint and renders agricultural forecasts.
 */

document.addEventListener('DOMContentLoaded', () => {
    const locationSelect = document.getElementById('weatherLocationSelect');
    const refreshBtn = document.getElementById('btnRefreshWeather');
    const customCoordsBtn = document.getElementById('btnCustomCoords');

    // Initial weather load
    fetchSelectedWeather();

    if (locationSelect) {
        locationSelect.addEventListener('change', fetchSelectedWeather);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchSelectedWeather);
    }

    if (customCoordsBtn) {
        customCoordsBtn.addEventListener('click', () => {
            const lat = document.getElementById('customLat').value;
            const lon = document.getElementById('customLon').value;
            if (!lat || !lon) {
                showToast('warning', 'Please enter both valid latitude and longitude coordinates.');
                return;
            }
            fetchWeatherData(lat, lon, 'Custom Region', 'India');
        });
    }
});

function fetchSelectedWeather() {
    const select = document.getElementById('weatherLocationSelect');
    const parts = select.value.split(',');
    const lat = parts[0];
    const lon = parts[1];
    const city = parts[2] || 'Selected City';
    const state = parts[3] || 'India';

    fetchWeatherData(lat, lon, city, state);
}

async function fetchWeatherData(lat, lon, city, state) {
    const loadingEl = document.getElementById('weatherLoading');
    const contentEl = document.getElementById('weatherContentSection');
    const errorEl = document.getElementById('weatherErrorAlert');

    loadingEl.classList.remove('d-none');
    contentEl.classList.add('d-none');
    errorEl.classList.add('d-none');

    try {
        const url = `/api/weather/forecast?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success) {
            renderWeatherView(data);
            contentEl.classList.remove('d-none');
        } else {
            errorEl.textContent = data.message || 'Unable to retrieve live Open-Meteo weather data.';
            errorEl.classList.remove('d-none');
        }
    } catch (err) {
        console.error('Weather fetch error:', err);
        errorEl.textContent = 'Connection error. Could not reach Open-Meteo API.';
        errorEl.classList.remove('d-none');
    } finally {
        loadingEl.classList.add('d-none');
    }
}

function renderWeatherView(data) {
    const current = data.current || {};
    const loc = data.location || {};

    // Header & Location
    document.getElementById('weatherLocationName').textContent = `${loc.city}, ${loc.state}`;
    document.getElementById('weatherCoordinates').textContent = `Latitude: ${loc.lat.toFixed(4)}° N | Longitude: ${loc.lon.toFixed(4)}° E`;
    document.getElementById('weatherObsTime').textContent = `Observation: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    // Current Readings
    const temp = Math.round(current.temperature);
    document.getElementById('weatherCurrentTemp').textContent = `${temp}°C`;
    document.getElementById('weatherMainCondition').textContent = current.condition || 'Clear';
    document.getElementById('weatherFeelsLike').textContent = `Feels like ${Math.round(current.feelsLike || temp)}°C`;
    document.getElementById('weatherHumidity').textContent = `${current.humidity}%`;
    document.getElementById('weatherWindSpeed').textContent = `${current.windSpeed} km/h`;
    document.getElementById('weatherPrecip').textContent = `${current.precipitation || 0} mm`;

    const mainIcon = document.getElementById('weatherMainIcon');
    if (current.icon) {
        mainIcon.className = `bi ${current.icon}`;
    }

    // Advisories Rendering
    const advContainer = document.getElementById('weatherAdvisoriesContainer');
    advContainer.innerHTML = '';
    const advisories = data.advisories || [];

    advisories.forEach(adv => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        const iconClass = adv.level === 'danger' ? 'bi-exclamation-triangle-fill text-danger' :
                          adv.level === 'warning' ? 'bi-wind text-warning' :
                          adv.level === 'success' ? 'bi-check-circle-fill text-success' : 'bi-info-circle-fill text-primary';

        col.innerHTML = `
            <div class="p-3 border rounded-3 bg-white h-100 shadow-sm d-flex gap-3 align-items-start">
                <div class="fs-2">${`<i class="bi ${iconClass}"></i>`}</div>
                <div>
                    <h6 class="fw-bold mb-1">${escapeHtml(adv.title)}</h6>
                    <p class="text-muted small mb-0">${escapeHtml(adv.message)}</p>
                </div>
            </div>
        `;
        advContainer.appendChild(col);
    });

    // 7-Day Forecast Grid Rendering
    const forecastGrid = document.getElementById('weatherForecastGrid');
    forecastGrid.innerHTML = '';
    const forecast = data.forecast || [];

    forecast.forEach(day => {
        const dateObj = new Date(day.date);
        const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
        const dayDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

        const col = document.createElement('div');
        col.className = 'col-6 col-md-3 col-xl';

        col.innerHTML = `
            <div class="weather-forecast-card h-100 shadow-sm">
                <div class="fw-bold text-dark">${dayName}</div>
                <small class="text-muted d-block mb-2">${dayDate}</small>
                
                <div class="fs-2 text-primary my-2">
                    <i class="bi ${day.icon || 'bi-sun'}"></i>
                </div>
                
                <div class="small fw-semibold text-truncate mb-2" title="${escapeHtml(day.condition)}">
                    ${escapeHtml(day.condition)}
                </div>

                <div class="d-flex justify-content-center gap-2 small">
                    <strong class="text-danger">${Math.round(day.maxTemp)}°</strong>
                    <span class="text-muted">/</span>
                    <strong class="text-primary">${Math.round(day.minTemp)}°</strong>
                </div>

                <div class="mt-2 pt-2 border-top small text-muted">
                    <i class="bi bi-droplet text-info"></i> ${day.rainProbability || 0}%
                </div>
            </div>
        `;
        forecastGrid.appendChild(col);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
