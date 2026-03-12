// Weatherby - Weather Data Module
const WeatherData = (() => {
  let config = {};
  let currentLocation = { lat: 51.5074, lon: -0.1278, name: 'LONDON, UK' };
  let useFahrenheit = false;

  const WMO_CODES = {
    0:  { desc: 'CLEAR SKY',            icon: '☀️',  emoji: '☀️'  },
    1:  { desc: 'MAINLY CLEAR',         icon: '🌤',  emoji: '🌤'  },
    2:  { desc: 'PARTLY CLOUDY',        icon: '⛅',  emoji: '⛅'  },
    3:  { desc: 'OVERCAST',             icon: '☁️',  emoji: '☁️'  },
    45: { desc: 'FOG',                  icon: '🌫',  emoji: '🌫'  },
    48: { desc: 'ICING FOG',            icon: '🌫',  emoji: '🌫'  },
    51: { desc: 'LIGHT DRIZZLE',        icon: '💧',  emoji: '💧'  },
    53: { desc: 'MODERATE DRIZZLE',     icon: '💧',  emoji: '💧'  },
    55: { desc: 'DENSE DRIZZLE',        icon: '💧',  emoji: '💧'  },
    61: { desc: 'SLIGHT RAIN',          icon: '🌦',  emoji: '🌦'  },
    63: { desc: 'MODERATE RAIN',        icon: '🌧',  emoji: '🌧'  },
    65: { desc: 'HEAVY RAIN',           icon: '🌧',  emoji: '🌧'  },
    71: { desc: 'SLIGHT SNOW',          icon: '🌨',  emoji: '🌨'  },
    73: { desc: 'MODERATE SNOW',        icon: '❄️',  emoji: '❄️'  },
    75: { desc: 'HEAVY SNOW',           icon: '❄️',  emoji: '❄️'  },
    77: { desc: 'SNOW GRAINS',          icon: '🌨',  emoji: '🌨'  },
    80: { desc: 'SLIGHT SHOWERS',       icon: '🌦',  emoji: '🌦'  },
    81: { desc: 'MODERATE SHOWERS',     icon: '🌧',  emoji: '🌧'  },
    82: { desc: 'VIOLENT SHOWERS',      icon: '⛈',  emoji: '⛈'  },
    85: { desc: 'SLIGHT SNOW SHOWERS',  icon: '🌨',  emoji: '🌨'  },
    86: { desc: 'HEAVY SNOW SHOWERS',   icon: '❄️',  emoji: '❄️'  },
    95: { desc: 'THUNDERSTORM',         icon: '⛈',  emoji: '⛈'  },
    96: { desc: 'THUNDERSTORM W/ HAIL', icon: '⛈',  emoji: '⛈'  },
    99: { desc: 'SEVERE THUNDERSTORM',  icon: '🌩',  emoji: '🌩'  },
  };

  async function fetchConfig() {
    try {
      const res = await fetch('/api/config');
      config = await res.json();
      if (config.defaultLocation) {
        const [lat, lon] = config.defaultLocation.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
          currentLocation = { lat, lon, name: 'DEFAULT' };
        }
      }
    } catch (e) {
      console.warn('Config fetch failed:', e);
    }
    return config;
  }

  async function fetchWeather(lat, lon) {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Weather fetch failed');
    return res.json();
  }

  async function fetchForecast(lat, lon) {
    const res = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Forecast fetch failed');
    return res.json();
  }

  async function fetchAlerts(lat, lon) {
    try {
      const res = await fetch(`/api/alerts?lat=${lat}&lon=${lon}`);
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      return [];
    }
  }

  async function fetchRainViewer() {
    try {
      const res = await fetch('/api/rainviewer');
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      return null;
    }
  }

  function getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(currentLocation);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          currentLocation = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: 'YOUR LOCATION'
          };
          resolve(currentLocation);
        },
        () => resolve(currentLocation),
        { timeout: 8000 }
      );
    });
  }

  function toF(c) {
    return (c * 9 / 5) + 32;
  }

  function windDirToCompass(deg) {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  return {
    fetchConfig, fetchWeather, fetchForecast, fetchAlerts, fetchRainViewer, getLocation,
    WMO_CODES, toF, windDirToCompass,
    get currentLocation() { return currentLocation; },
    set currentLocation(v) { currentLocation = v; },
    get useFahrenheit() { return useFahrenheit; },
    set useFahrenheit(v) { useFahrenheit = v; },
    get config() { return config; }
  };
})();
