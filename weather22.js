// Replace with your WeatherAPI.com API key
const WEATHER_API_KEY = 'd33f8c00c650428d87632621252001';

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

// Update time and date
function updateDateTime() {
    const now = new Date();
    const timeFormat = localStorage.getItem('timeFormat') || '12';
    
    // Update time with respect to format preference
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: timeFormat === '12'
    });
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) timeElement.textContent = timeStr;
    
    // Update date
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const dateElement = document.getElementById('current-date');
    if (dateElement) dateElement.textContent = dateStr;
}

// Start clock update
let clockInterval = setInterval(updateDateTime, 1000);
updateDateTime(); // Initial update

// Function to handle weather alerts
function updateWeatherAlert(alerts) {
    const alertCard = document.getElementById('weather-alert-card');
    const alertContent = document.getElementById('weather-alert-content');
    
    if (!alertCard || !alertContent) return;

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
            <small>Until: ${new Date(alert.effective).toLocaleString()}</small>
        `;

        alertCard.style.display = 'block';
    } else {
        alertCard.style.display = 'none';
    }
}

// Moon phase calculation and display
function getMoonPhase(moonPhase) {
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
    const moonIcon = document.getElementById('moon-icon');
    const moonText = document.getElementById('moon-phase-text');
    
    if (!moonIcon || !moonText) return;

    const moonInfo = getMoonPhase(moonPhase);
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

// Enhanced weather data fetch with error handling
async function fetchWeatherData(lat, lon) {
    try {
        // First try to get city/state
        const cityStateResponse = await fetch(
            `https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${lat},${lon}`
        );
        
        if (!cityStateResponse.ok) {
            console.error('City/State API Error:', cityStateResponse.status, await cityStateResponse.text());
            throw new Error(`City/State API error: ${cityStateResponse.status}`);
        }

        const locationData = await cityStateResponse.json();
        if (locationData && locationData[0]) {
            const location = locationData[0];
            const locationText = document.getElementById('location-text');
            if (locationText) {
                locationText.textContent = `${location.name}, ${location.region}`;
            }
        }

        // Then fetch weather data
        const weatherResponse = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=4&aqi=yes&alerts=yes`
        );
        
        if (!weatherResponse.ok) {
            console.error('Weather API Error:', weatherResponse.status, await weatherResponse.text());
            throw new Error(`Weather API error: ${weatherResponse.status}`);
        }

        const data = await weatherResponse.json();
        
        // Update current weather
        const elements = {
            tempC: document.getElementById('weather-temp-c'),
            tempF: document.getElementById('weather-temp-f'),
            weatherIcon: document.getElementById('weather-icon'),
            weatherDesc: document.getElementById('weather-description')
        };

        if (elements.tempC) elements.tempC.textContent = `${data.current.temp_c.toFixed(1)}°`;
        if (elements.tempF) elements.tempF.textContent = `${data.current.temp_f.toFixed(1)}°`;
        
        const condition = data.current.condition.text;
        const iconClass = weatherIcons[condition] || weatherIcons.default;
        
        if (elements.weatherIcon) elements.weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
        if (elements.weatherDesc) elements.weatherDesc.textContent = condition;
        
        // Update weather alerts if available
        if (data.alerts && data.alerts.alert) {
            updateWeatherAlert(data.alerts.alert);
        }
        
        // Update forecast
        updateForecast(data.forecast.forecastday);
        
        // Update moon phase
        updateMoonPhase(data.forecast.forecastday[0].astro.moon_phase);
        
        // Update AQI if available
        if (data.current.air_quality) {
            const aqi = Math.round(data.current.air_quality['us-epa-index']);
            const aqiInfo = getAQIInfo(aqi);
            
            const gaugeValue = document.querySelector('#aqi-gauge .gauge-value');
            const aqiDescription = document.getElementById('aqi-description');
            const aqiGauge = document.getElementById('aqi-gauge');
            
            if (gaugeValue) gaugeValue.textContent = aqi;
            if (aqiDescription) aqiDescription.textContent = aqiInfo.description;
            if (aqiGauge) aqiGauge.style.backgroundColor = aqiInfo.color;
        }
        
        // Update status
        const status = document.getElementById('status');
        if (status) status.textContent = 'Weather data updated successfully';
        
    } catch (error) {
        console.error('Detailed error:', error);
        // Update UI to show error
        const elements = {
            weatherDesc: document.getElementById('weather-description'),
            weatherIcon: document.getElementById('weather-icon'),
            status: document.getElementById('status'),
            errorMessage: document.getElementById('error-message')
        };
        
        if (elements.weatherDesc) elements.weatherDesc.textContent = 'Weather data unavailable';
        if (elements.weatherIcon) elements.weatherIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        if (elements.status) elements.status.textContent = 'Error fetching weather data';
        if (elements.errorMessage) {
            elements.errorMessage.textContent = `Error: ${error.message}`;
            elements.errorMessage.style.display = 'block';
        }
    }
}

// Update forecast
function updateForecast(forecast) {
    const container = document.getElementById('forecast-container');
    if (!container) return;

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
    const elements = {
        tempUnit: document.getElementById('temp-unit'),
        timeFormat: document.getElementById('time-format'),
        refreshInterval: document.getElementById('refresh-interval'),
        darkMode: document.getElementById('dark-mode-toggle')
    };

    // Temperature unit preference
    if (elements.tempUnit) {
        elements.tempUnit.addEventListener('change', function(e) {
            localStorage.setItem('tempUnit', e.target.value);
            updateDisplays();
        });
    }

    // Time format preference
    if (elements.timeFormat) {
        elements.timeFormat.addEventListener('change', function(e) {
            localStorage.setItem('timeFormat', e.target.value);
            updateDateTime();
        });
    }

    // Refresh interval
    if (elements.refreshInterval) {
        elements.refreshInterval.addEventListener('change', function(e) {
            localStorage.setItem('refreshInterval', e.target.value);
            setupRefreshInterval();
        });
    }

    // Dark mode toggle
    if (elements.darkMode) {
        elements.darkMode.addEventListener('change', function(e) {
            document.body.classList.toggle('dark-mode', e.target.checked);
            localStorage.setItem('darkMode', e.target.checked);
        });
    }

    // Load saved preferences
    const savedPrefs = {
        tempUnit: localStorage.getItem('tempUnit') || 'C',
        timeFormat: localStorage.getItem('timeFormat') || '12',
        refreshInterval: localStorage.getItem('refreshInterval') || '300000',
        darkMode: localStorage.getItem('darkMode') === 'true'
    };

    // Apply saved preferences
    if (elements.tempUnit) elements.tempUnit.value = savedPrefs.tempUnit;
    if (elements.timeFormat) elements.timeFormat.value = savedPrefs.timeFormat;
    if (elements.refreshInterval) elements.refreshInterval.value = savedPrefs.refreshInterval;
    if (elements.darkMode) elements.darkMode.checked = savedPrefs.darkMode;
    
    document.body.classList.toggle('dark-mode', savedPrefs.darkMode);
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
                },
                error => {
                    console.error('Geolocation error:', error);
                    showError('Unable to get location: ' + error.message);
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
                showError('Location access denied: ' + error.message);
                document.getElementById('weather-description').textContent = 'Location access denied';
            }
        );
    } else {
        showError('Geolocation is not supported by this browser');
        document.getElementById('weather-description').textContent = 'Geolocation not supported';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    const statusElement = document.getElementById('status');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    if (statusElement) {
        statusElement.textContent = 'Error occurred';
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
                    const elements = {
                        tempC: document.getElementById('temperature-c'),
                        tempF: document.getElementById('temperature-f'),
                        humidity: document.getElementById('humidity'),
                        cpuTempC: document.getElementById('cpu-temp-c'),
                        cpuTempF: document.getElementById('cpu-temp-f'),
                        timestamp: document.getElementById('timestamp'),
                        status: document.getElementById('status'),
                        errorMessage: document.getElementById('error-message')
                    };

                    // Update sensor readings with null checks
                    if (elements.tempC) elements.tempC.textContent = `${latestData.temperature_c.toFixed(1)}°`;
                    if (elements.tempF) elements.tempF.textContent = `${latestData.temperature_f.toFixed(1)}°`;
                    if (elements.humidity) elements.humidity.textContent = `${latestData.humidity.toFixed(1)}%`;
                    if (elements.cpuTempC) elements.cpuTempC.textContent = `${latestData.cpu_temp_c.toFixed(1)}°`;
                    if (elements.cpuTempF) elements.cpuTempF.textContent = `${latestData.cpu_temp_f.toFixed(1)}°`;

                    // Update timestamp and status
                    const timestamp = new Date(latestData.timestamp);
                    if (elements.timestamp) {
                        elements.timestamp.textContent = `Last updated: ${timestamp.toLocaleString()}`;
                    }
                    if (elements.status) {
                        elements.status.textContent = 'Connected - Live Data';
                    }
                    if (elements.errorMessage) {
                        elements.errorMessage.style.display = 'none';
                    }
                } else {
                    const statusElement = document.getElementById('status');
                    if (statusElement) {
                        statusElement.textContent = 'Connected - Waiting for data';
                    }
                }
            } catch (error) {
                console.error('Error processing data:', error);
                showError('Error processing sensor data: ' + error.message);
            }
        }, function(error) {
            console.error('Database error:', error);
            showError('Database connection error: ' + error.message);
        });

    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Error initializing sensor monitoring: ' + error.message);
    }
});

// Function to update all temperature displays based on user preference
function updateDisplays() {
    // This function can be implemented if you need to update temperature displays
    // based on user preference (C/F) after the initial load
    const tempUnit = localStorage.getItem('tempUnit') || 'C';
    // Implementation would go here
}

// Export any functions that need to be accessed from other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateDateTime,
        fetchWeatherData,
        updateForecast,
        initializeSettings,
        setupRefreshInterval,
        initWeather,
        showError
    };
}
// Add this to your existing Firebase configuration
function updateBatteryData() {
    const batteryRef = firebase.database().ref('battery_data/latest');
    batteryRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Update battery values
            document.getElementById('battery-voltage').textContent = `${data.voltage.toFixed(2)}V`;
            document.getElementById('battery-current').textContent = `${data.current.toFixed(1)}A`;
            document.getElementById('battery-power').textContent = `${data.power.toFixed(0)}W`;
            document.getElementById('battery-soc').textContent = `${data.state_of_charge.toFixed(1)}%`;
            document.getElementById('battery-temp').textContent = `${data.temperature.toFixed(1)}°C`;
            
            // Format time to go
            let ttgText = '∞';
            if (data.time_to_go >= 0) {
                const hours = Math.floor(data.time_to_go / 60);
                const mins = data.time_to_go % 60;
                ttgText = `${hours}h ${mins}m`;
            }
            document.getElementById('battery-ttg').textContent = ttgText;

            // Update timestamp
            const timestamp = new Date(data.timestamp);
            document.getElementById('battery-last-update').textContent = timestamp.toLocaleString();
            
            // Add visual indicators based on battery state
            const socElement = document.getElementById('battery-soc');
            if (data.state_of_charge < 20) {
                socElement.style.color = '#ff4444';
            } else if (data.state_of_charge < 50) {
                socElement.style.color = '#ffaa00';
            } else {
                socElement.style.color = '#4CAF50';
            }
        }
    });
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', function() {
    // Your existing initialization code...
    
    // Initialize battery data updates
    updateBatteryData();
});
