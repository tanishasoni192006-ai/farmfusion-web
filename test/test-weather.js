/**
 * Test Open-Meteo Weather API Integration
 */
async function testWeather() {
    console.log('Testing Open-Meteo API integration...');
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=30.9010&longitude=75.8573&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto';
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo status: ${res.status}`);
    const data = await res.json();
    
    console.log('✅ Open-Meteo API connection SUCCESSFUL!');
    console.log(`Current Temp in Ludhiana: ${data.current.temperature_2m}°C`);
    console.log(`Relative Humidity: ${data.current.relative_humidity_2m}%`);
    console.log(`Wind Speed: ${data.current.wind_speed_10m} km/h`);
    console.log(`Daily Forecast Days count: ${data.daily.time.length}`);
}

testWeather().catch(e => {
    console.error('❌ Open-Meteo test failed:', e);
    process.exit(1);
});
