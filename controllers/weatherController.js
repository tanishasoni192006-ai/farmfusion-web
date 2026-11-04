/**
 * Weather Advisory Controller
 * Connects with Open-Meteo API and calculates agricultural actionable advisories.
 */

// Popular agricultural locations with verified coordinates
const AGRICULTURAL_LOCATIONS = [
    { city: 'Ludhiana', state: 'Punjab', lat: 30.9010, lon: 75.8573, cropBelt: 'Wheat & Rice' },
    { city: 'Karnal', state: 'Haryana', lat: 29.6857, lon: 76.9905, cropBelt: 'Basmati & Wheat' },
    { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, cropBelt: 'Vegetables & Paddy' },
    { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, cropBelt: 'Cotton & Oranges' },
    { city: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022, cropBelt: 'Groundnut & Cotton' },
    { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, cropBelt: 'Soybean & Wheat' },
    { city: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365, cropBelt: 'Chilli, Cotton & Tobacco' },
    { city: 'Davanagere', state: 'Karnataka', lat: 14.4644, lon: 75.9218, cropBelt: 'Maize & Sugarcane' },
    { city: 'Burdwan', state: 'West Bengal', lat: 23.2324, lon: 87.8615, cropBelt: 'Paddy Bowl' },
    { city: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, cropBelt: 'Maize & Pulses' },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, cropBelt: 'Mustard & Pearl Millet' },
    { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, cropBelt: 'Cotton & Tea' }
];

// WMO Weather code dictionary for interpretation
const WMO_CODE_MAP = {
    0: { text: 'Clear Sky', icon: 'bi-brightness-high', type: 'sunny' },
    1: { text: 'Mainly Clear', icon: 'bi-sun', type: 'sunny' },
    2: { text: 'Partly Cloudy', icon: 'bi-cloud-sun', type: 'cloudy' },
    3: { text: 'Overcast', icon: 'bi-clouds', type: 'cloudy' },
    45: { text: 'Foggy', icon: 'bi-cloud-fog', type: 'fog' },
    48: { text: 'Depositing Rime Fog', icon: 'bi-cloud-fog2', type: 'fog' },
    51: { text: 'Light Drizzle', icon: 'bi-cloud-drizzle', type: 'rain' },
    53: { text: 'Moderate Drizzle', icon: 'bi-cloud-drizzle', type: 'rain' },
    55: { text: 'Dense Drizzle', icon: 'bi-cloud-rain-heavy', type: 'rain' },
    61: { text: 'Slight Rain', icon: 'bi-cloud-rain', type: 'rain' },
    63: { text: 'Moderate Rain', icon: 'bi-cloud-rain-fill', type: 'rain' },
    65: { text: 'Heavy Rain', icon: 'bi-cloud-rain-heavy-fill', type: 'rain' },
    71: { text: 'Slight Snow Fall', icon: 'bi-snow', type: 'snow' },
    80: { text: 'Slight Rain Showers', icon: 'bi-cloud-rain', type: 'rain' },
    81: { text: 'Moderate Rain Showers', icon: 'bi-cloud-rain-heavy', type: 'rain' },
    82: { text: 'Violent Rain Showers', icon: 'bi-cloud-lightning-rain', type: 'storm' },
    95: { text: 'Thunderstorm', icon: 'bi-cloud-lightning', type: 'storm' },
    96: { text: 'Thunderstorm with Hail', icon: 'bi-cloud-lightning-fill', type: 'storm' }
};

exports.getLocations = (req, res) => {
    res.status(200).json({
        success: true,
        locations: AGRICULTURAL_LOCATIONS
    });
};

exports.getForecast = async (req, res, next) => {
    try {
        const { lat = 30.9010, lon = 75.8573, city = 'Ludhiana', state = 'Punjab' } = req.query;

        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;

        // Direct fetch from Open-Meteo
        const response = await fetch(openMeteoUrl);
        if (!response.ok) {
            throw new Error(`Open-Meteo API returned status ${response.status}`);
        }

        const data = await response.json();
        const current = data.current || {};
        const daily = data.daily || {};

        const weatherCode = current.weather_code || 0;
        const condition = WMO_CODE_MAP[weatherCode] || { text: 'Clear', icon: 'bi-sun', type: 'sunny' };

        // Calculate agricultural farming alerts
        const alerts = [];
        const windSpeed = current.wind_speed_10m || 0;
        const currentRain = current.precipitation || 0;
        const rainProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[0]) || 0;

        if (windSpeed > 20) {
            alerts.push({
                level: 'warning',
                title: 'High Wind Alert',
                message: `Wind speed is ${windSpeed} km/h. Avoid foliar pesticide or herbicide spraying to minimize drift.`
            });
        } else {
            alerts.push({
                level: 'success',
                title: 'Spraying Conditions Favorable',
                message: `Calm wind (${windSpeed} km/h). Safe for foliar nutrient and chemical spray application.`
            });
        }

        if (rainProb > 60 || currentRain > 2) {
            alerts.push({
                level: 'danger',
                title: 'Rain / Inundation Alert',
                message: `High rain chance (${rainProb}%). Defer flood irrigation and scheduled urea top-dressing.`
            });
        } else {
            alerts.push({
                level: 'info',
                title: 'Irrigation Scheduling',
                message: 'No immediate heavy rainfall forecasted. Proceed with planned field irrigation.'
            });
        }

        // Parse 7-day forecast
        const forecastDays = [];
        if (daily.time) {
            for (let i = 0; i < daily.time.length; i++) {
                const code = daily.weather_code ? daily.weather_code[i] : 0;
                const info = WMO_CODE_MAP[code] || { text: 'Clear', icon: 'bi-sun' };
                forecastDays.push({
                    date: daily.time[i],
                    maxTemp: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
                    minTemp: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
                    rainSum: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
                    rainProbability: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
                    condition: info.text,
                    icon: info.icon
                });
            }
        }

        res.status(200).json({
            success: true,
            location: {
                city,
                state,
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            },
            current: {
                temperature: current.temperature_2m,
                feelsLike: current.apparent_temperature,
                humidity: current.relative_humidity_2m,
                windSpeed: current.wind_speed_10m,
                precipitation: current.precipitation,
                condition: condition.text,
                icon: condition.icon,
                time: current.time
            },
            advisories: alerts,
            forecast: forecastDays
        });
    } catch (err) {
        console.error('Weather forecast API error:', err.message);
        res.status(502).json({
            success: false,
            message: 'Unable to retrieve live Open-Meteo weather data at this moment.',
            error: err.message
        });
    }
};
