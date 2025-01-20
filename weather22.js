// Replace with your WeatherAPI.com API key
const WEATHER_API_KEY = 'd33f8c00c650428d87632621252001';

// Update time and date
function updateDateTime() {
    const now = new Date();
    
    // Update time
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = timeStr;
    
    // Update date
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('current-date').textContent = dateStr;
}

// Start clock update
setInterval(updateDateTime, 1000);
updateDateTime(); // Initial update

// Function to get city and state from coordinates
async function getCityState(lat, lon) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`
        );

        if (!response.ok) throw new Error('Geocoding API error');

        const data = await response.json();
        if (data && data[0]) {
            const location = data[0];
            const city = location.name;
            const region = location.region;
            document.getElementById('location-text').textContent = `${city}, ${region}`;
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        document.getElementById('location-text').textContent = 'Location unavailable';
    }
}

// Function to handle weather alerts
function updateWeatherAlert(alerts) {
    const alertCard = document.getElementById('weather-alert-card');
    const alertContent = document.getElementById('weather-alert-content');

    if (alerts && alerts.length > 0) {
        const alert = alerts[0]; // Show the most recent alert

        let severityClass = 'moderate';
        if (alert.severity === 'Extreme' || alert.severity === 'Severe') {
            severityClass = 'severe';
        } else if (alert.severity === 'Minor') {
            severityClass = 'minor';
        }

        alertContent.className = `alert-content ${severityClass}`;
        alertContent.innerHTML = `
            <strong>${alert.event}</strong><br>
            ${alert.desc}<br>
            <small>Until: ${alert.effective}</small>
        `;

        alertCard.style.display = 'block';
    } else {
        alertCard.style.display = 'none';
    }
}

// Weather icons mapping (using WeatherAPI.com condition codes)
const weatherIcons = {
    'Sunny': 'fa-sun',
    'Clear': 'fa-moon',
    'Partly cloudy': 'fa-cloud-sun',
    'Cloudy': 'fa-cloud',
    'Overcast': 'fa-cloud',
    'Rain': 'fa-cloud-rain',
    'Snow': 'fa-snowflake',
    'Thunder': 'fa-bolt',
    'Mist': 'fa-smog',
    'Fog': 'fa-smog',
    'default': 'fa-cloud'
};

// Moon phase calculation
function getMoonPhase(moonPhase) {
    // Convert WeatherAPI.com moon phase string to icon and description
    const phases = {
        'New Moon': { icon: 'fa-moon', description: 'New Moon' },
        'Waxing Crescent': { icon: 'fa-moon', description: 'Waxing Crescent' },
        'First Quarter': { icon: 'fa-adjust', description: 'First Quarter' },
        'Waxing Gibbous': { icon: 'fa-moon', description: 'Waxing Gibbous' },
        'Full Moon': { icon: 'fa-moon', description: 'Full Moon' },
        'Waning Gibbous': { icon: 'fa-moon', description: 'Waning Gibbous' },
        'Last Quarter': { icon: 'fa-adjust fa-flip-horizontal', description: 'Last Quarter' },
        'Waning Crescent': { icon: 'fa-moon', description: 'Waning Crescent' }
    };

    return phases[moonPhase] || phases['New Moon'];
}

function updateMoonPhase(moonPhase) {
    const moonInfo = getMoonPhase(moonPhase);
    const moonIcon = document.getElementById('moon-icon');
    const moonText = document.getElementById('moon-phase-text');

    moonIcon.innerHTML = `<i class="fas ${moonInfo.icon}"></i>`;
    moonText.textContent = moonInfo.description;
}

// AQI color and description
function getAQIInfo(aqi) {
    const aqiRanges = [
        { max: 50, color: '#00e400', description: 'Good' },
        { max: 100, color: '#ffff00', description: 'Moderate' },
        { max: 150, color: '#ff7e00', description: 'Unhealthy for Sensitive Groups' },
        { max: 200, color: '#ff0000', description: 'Unhealthy' },
        { max: 300, color: '#99004c', description: 'Very Unhealthy' },
        { max: 500, color: '#7e0023', description: 'Hazardous' }
    ];

    for (const range of aqiRanges) {
        if (aqi <= range.max) {
            return range;
        }
    }
    return aqiRanges[aqiRanges.length - 1];
}

// Enhanced weather data fetch
async function fetchWeatherData(lat, lon) {
    await getCityState(lat, lon);
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=4&aqi=yes&alerts=yes`
        );
        
        if (!response.ok) {
            throw new Error('Weather API error');
        }

        const data = await response.json();
        
        // Update current weather
        const tempC = data.current.temp_c;
        const tempF = data.current.temp_f;
        
        document.getElementById('weather-temp-c').textContent = `${tempC.toFixed(1)}°`;
        document.getElementById('weather-temp-f').textContent = `${tempF.toFixed(1)}°`;
        
        const condition = data.current.condition.text;
        const iconClass = weatherIcons[condition] || weatherIcons.default;
        
        // Update weather alerts if available
        if (data.alerts && data.alerts.alert) {
            updateWeatherAlert(data.alerts.alert);
        }
        
        document.getElementById('weather-icon').innerHTML = `<i class="fas ${iconClass}"></i>`;
        document.getElementById('weather-description').textContent = condition;
        
        // Update forecast
        updateForecast(data.forecast.forecastday);
        
        // Update moon phase
        updateMoonPhase(data.forecast.forecastday[0].astro.moon_phase);
        
        // Update AQI if available
        if (data.current.air_quality) {
            const aqi = Math.round(data.current.air_quality['us-epa-index']);
            const aqiInfo = getAQIInfo(aqi);
            document.getElementById('aqi-value').textContent = aqi;
            document.getElementById('aqi-description').textContent = aqiInfo.description;
            document.getElementById('aqi-indicator').style.backgroundColor = aqiInfo.color;
        }
        
    } catch (error) {
        console.error('Weather API error:', error);
        document.getElementById('weather-description').textContent = 'Unable to fetch weather data';
    }
}

// Update forecast with WeatherAPI.com data structure
function updateForecast(forecast) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = forecast.slice(1).map(day => {
        const date = new Date(day.date);
        return `
            <div class="forecast-day">
                <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="forecast-icon">
                    <i class="fas ${weatherIcons[day.day.condition.text] || weatherIcons.default}"></i>
                </div>
                <div class="forecast-temp">
                    ${Math.round(day.day.avgtemp_c)}°C
                </div>
            </div>
        `;
    }).join('');
}

// Settings handlers
function initializeSettings() {
    // Temperature unit preference
    document.getElementById('temp-unit').addEventListener('change', function(e) {
        localStorage.setItem('tempUnit', e.target.value);
        updateDisplays();
    });

    // Time format preference
    document.getElementById('time-format').addEventListener('change', function(e) {
        localStorage.setItem('timeFormat', e.target.value);
        updateDateTime();
    });

    // Refresh interval
    document.getElementById('refresh-interval').addEventListener('change', function(e) {
        localStorage.setItem('refreshInterval', e.target.value);
        setupRefreshInterval();
    });

    // Dark mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('change', function(e) {
        document.body.classList.toggle('dark-mode', e.target.checked);
        localStorage.setItem('darkMode', e.target.checked);
    });

    // Load saved preferences
    const tempUnit = localStorage.getItem('tempUnit') || 'C';
    const timeFormat = localStorage.getItem('timeFormat') || '12';
    const refreshInterval = localStorage.getItem('refreshInterval') || '300000';
    const darkMode = localStorage.getItem('darkMode') === 'true';

    document.getElementById('temp-unit').value = tempUnit;
    document.getElementById('time-format').value = timeFormat;
    document.getElementById('refresh-interval').value = refreshInterval;
    document.getElementById('dark-mode-toggle').checked = darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
}

// Function to setup refresh interval
function setupRefreshInterval() {
    const interval = parseInt(localStorage.getItem('refreshInterval')) || 300000;
    if (window.refreshTimer) {
        clearInterval(window.refreshTimer);
    }
    window.refreshTimer = setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    fetchWeatherData(position.coords.latitude, position.coords.longitude);
                }
            );
        }
    }, interval);
}

// Get user location and fetch weather
function initWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                fetchWeatherData(
                    position.coords.latitude,
                    position.coords.longitude
                );
            },
            error => {
                console.error('Geolocation error:', error);
                document.getElementById('weather-description').textContent = 'Location access denied';
            }
        );
    } else {
        document.getElementById('weather-description').textContent = 'Geolocation not supported';
    }
}

// Firebase initialization and sensor data handling
document.addEventListener('DOMContentLoaded', function() {
    // Initialize weather data
    initWeather();
    initializeSettings();
    setupRefreshInterval();

    try {
        const firebaseConfig = {
            apiKey: "AIzaSyD3P4c3HTpBIYkbqe_PRwSndGJfNQIZtDg",
            authDomain: "raspberrygps-36044.firebaseapp.com",
            databaseURL: "https://raspberrygps-36044-default-rtdb.firebaseio.com",
            storageBucket: "raspberrygps-36044.appspot.com"
        };

        firebase.initializeApp(firebaseConfig);
        const dbRef = firebase.database().ref('sensor_readings');

        dbRef.on('value', function(snapshot) {
            try {
                const data = snapshot.val();
                if (data) {
                    const latestKey = Object.keys(data)[0];
                    const latestData = data[latestKey];

                    // Update temperature displays
                    document.getElementById('temperature-c').textContent = 
                        `${latestData.temperature_c.toFixed(1)}°`;
                    document.getElementById('temperature-f').textContent = 
                        `${latestData.temperature_f.toFixed(1)}°`;
                    
                    // Update humidity
                    document.getElementById('humidity').textContent = 
                        `${latestData.humidity.toFixed(1)}%`;
                    
                    // Update CPU temperature
                    document.getElementById('cpu-temp-c').textContent = 
                        `${latestData.cpu_temp_c.toFixed(1)}°`;
                    document.getElementById('cpu-temp-f').textContent = 
                        `${latestData.cpu_temp_f.toFixed(1)}°`;
                    
                    // Update timestamp
                    const timestamp = new Date(latestData.timestamp);
                    document.getElementById('timestamp').textContent = 
                        `Last updated: ${timestamp.toLocaleString()}`;

                    document.getElementById('status').textContent = 'Connected - Live Data';
                    document.getElementById('error-message').style.display = 'none';
                } else {
                    document.getElementById('status').textContent = 'Connected - Waiting for data';
                }
            } catch (error) {
                console.error('Error processing data:', error);
                showError('Error processing data: ' + error.message);
            }
        }, function(error) {
            console.error('Database error:', error);
            showError('Database error: ' + error.message);
        });

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Error initializing Firebase: ' + error.message);
    }
});

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    document.getElementById('status').textContent = 'Error occurred';
}
