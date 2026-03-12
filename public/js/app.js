// Weatherby - Main Application
const App = (() => {
  let tempChart = null;
  let precipChart = null;
  let crtMode = false;
  let currentView = 'globe';
  let forecastData = null;
  let lastWeather = null;

  const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function getWeatherDesc(code) {
    return WeatherData.WMO_CODES[code] || { desc: 'UNKNOWN', icon: '🌡', emoji: '🌡' };
  }

  function formatTemp(c) {
    if (WeatherData.useFahrenheit) {
      return WeatherData.toF(c).toFixed(1);
    }
    return c.toFixed(1);
  }

  function tempUnit() {
    return WeatherData.useFahrenheit ? '°F' : '°C';
  }

  function updateWeatherDisplay(data) {
    if (!data || !data.current) return;
    const c = data.current;
    lastWeather = data;

    const wmo = getWeatherDesc(c.weather_code);
    document.getElementById('weather-icon-large').textContent = wmo.emoji;
    document.getElementById('temp-big').textContent = formatTemp(c.temperature_2m);
    document.getElementById('temp-unit').textContent = tempUnit();
    document.getElementById('condition-desc').textContent = wmo.desc;
    document.getElementById('feels-like').textContent  = `${formatTemp(c.apparent_temperature)}${tempUnit()}`;
    document.getElementById('humidity').textContent    = `${c.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent  = `${Math.round(c.wind_speed_10m)} MPH`;
    document.getElementById('wind-dir').textContent    = WeatherData.windDirToCompass(c.wind_direction_10m);
    document.getElementById('pressure').textContent   = `${Math.round(c.pressure_msl)} hPa`;
    document.getElementById('uv-index').textContent   = (c.uv_index !== undefined ? c.uv_index.toFixed(1) : '--');
    document.getElementById('cloud-cover').textContent = `${c.cloud_cover}%`;
    document.getElementById('precip').textContent     = `${c.precipitation !== undefined ? c.precipitation.toFixed(1) : '0.0'} mm`;

    const now = new Date();
    document.getElementById('last-updated').textContent =
      now.getUTCHours().toString().padStart(2,'0') + ':' +
      now.getUTCMinutes().toString().padStart(2,'0') + ':' +
      now.getUTCSeconds().toString().padStart(2,'0');

    const loc = WeatherData.currentLocation;
    TickerModule.setWeatherSummary(
      loc.name,
      `${formatTemp(c.temperature_2m)}${tempUnit()}`,
      wmo.desc
    );
  }

  function renderHourlyForecast(data) {
    const list = document.getElementById('hourly-list');
    if (!list || !data || !data.hourly) return;

    const hours  = data.hourly.time.slice(0, 24);
    const temps  = data.hourly.temperature_2m.slice(0, 24);
    const precips = data.hourly.precipitation_probability.slice(0, 24);
    const codes  = data.hourly.weather_code.slice(0, 24);

    list.innerHTML = '';
    hours.forEach((time, i) => {
      const dt = new Date(time);
      const h = dt.getHours().toString().padStart(2, '0') + ':00';
      const wmo = getWeatherDesc(codes[i]);
      const item = document.createElement('div');
      item.className = 'forecast-item';
      item.innerHTML = `
        <span class="forecast-time">${h}</span>
        <span class="forecast-icon">${wmo.emoji}</span>
        <span class="forecast-desc">${wmo.desc}</span>
        <span class="forecast-temp">${formatTemp(temps[i])}${tempUnit()}</span>
        <span class="forecast-precip">${precips[i] !== undefined ? precips[i] : 0}%💧</span>
      `;
      list.appendChild(item);
    });
  }

  function renderDailyForecast(data) {
    const list = document.getElementById('daily-list');
    if (!list || !data || !data.daily) return;

    const days     = data.daily.time;
    const codes    = data.daily.weather_code;
    const maxTemps = data.daily.temperature_2m_max;
    const minTemps = data.daily.temperature_2m_min;
    const precips  = data.daily.precipitation_sum;

    list.innerHTML = '';
    days.forEach((date, i) => {
      const dt = new Date(date + 'T12:00:00');
      const dayName = i === 0 ? 'TODAY' : i === 1 ? 'TMRW' : DAYS[dt.getDay()];
      const wmo = getWeatherDesc(codes[i]);
      const item = document.createElement('div');
      item.className = 'forecast-item daily-item';
      item.innerHTML = `
        <span class="daily-day">${dayName}</span>
        <span class="forecast-icon">${wmo.emoji}</span>
        <span class="forecast-desc">${wmo.desc}</span>
        <span class="daily-temps">
          <span class="temp-max">${formatTemp(maxTemps[i])}°</span>
          <span style="color:var(--color-text-dim)"> / </span>
          <span class="temp-min">${formatTemp(minTemps[i])}°</span>
        </span>
        <span class="daily-precip">${(precips[i] || 0).toFixed(1)}mm</span>
      `;
      list.appendChild(item);
    });
  }

  function showForecast(type) {
    const hourly = document.getElementById('hourly-forecast');
    const daily  = document.getElementById('daily-forecast');
    const tabs   = document.querySelectorAll('.forecast-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (type === 'hourly') {
      hourly.classList.remove('hidden');
      daily.classList.add('hidden');
      if (tabs[0]) tabs[0].classList.add('active');
    } else {
      hourly.classList.add('hidden');
      daily.classList.remove('hidden');
      if (tabs[1]) tabs[1].classList.add('active');
    }
  }

  function initCharts() {
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(5,8,16,0.95)',
          borderColor: '#00e5ff',
          borderWidth: 1,
          titleColor: '#ffb300',
          bodyColor: '#00ff41',
          titleFont: { family: "'VT323', monospace", size: 14 },
          bodyFont: { family: "'VT323', monospace", size: 13 },
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,229,255,0.05)' },
          ticks: { color: '#004d00', font: { family: "'VT323', monospace", size: 11 }, maxRotation: 0 }
        },
        y: {
          grid: { color: 'rgba(0,229,255,0.08)' },
          ticks: { color: '#004d00', font: { family: "'VT323', monospace", size: 11 } }
        }
      }
    };

    const tempCtx = document.getElementById('temp-chart');
    if (tempCtx) {
      tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: [],
            borderColor: '#00e5ff',
            backgroundColor: 'rgba(0,229,255,0.05)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#00e5ff',
            pointRadius: 2,
            pointHoverRadius: 5
          }]
        },
        options: { ...chartDefaults }
      });
    }

    const precipCtx = document.getElementById('precip-chart');
    if (precipCtx) {
      precipChart = new Chart(precipCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: 'rgba(21,101,192,0.6)',
            borderColor: '#00e5ff',
            borderWidth: 1,
            borderRadius: 2
          }]
        },
        options: {
          ...chartDefaults,
          scales: {
            ...chartDefaults.scales,
            y: { ...chartDefaults.scales.y, min: 0, max: 100 }
          }
        }
      });
    }
  }

  function updateCharts(data) {
    if (!data || !data.hourly) return;
    const hours   = data.hourly.time.slice(0, 24);
    const temps   = data.hourly.temperature_2m.slice(0, 24);
    const precips = data.hourly.precipitation_probability.slice(0, 24);

    const labels = hours.map(t => {
      const d = new Date(t);
      return d.getHours().toString().padStart(2,'0') + ':00';
    });

    const displayTemps = temps.map(t => WeatherData.useFahrenheit ? WeatherData.toF(t) : t);

    if (tempChart) {
      tempChart.data.labels = labels;
      tempChart.data.datasets[0].data = displayTemps.map(v => parseFloat(v.toFixed(1)));
      tempChart.update('none');
    }
    if (precipChart) {
      precipChart.data.labels = labels;
      precipChart.data.datasets[0].data = precips;
      precipChart.update('none');
    }
  }

  function switchView(view) {
    currentView = view;
    const globeContainer    = document.getElementById('globe-container');
    const radarContainer    = document.getElementById('radar-container');
    const globeLayerControls = document.getElementById('globe-layer-controls');
    const tabGlobe          = document.getElementById('tab-globe');
    const tabRadar          = document.getElementById('tab-radar');

    if (view === 'globe') {
      globeContainer.classList.remove('hidden');
      radarContainer.classList.add('hidden');
      if (globeLayerControls) globeLayerControls.classList.remove('hidden');
      if (tabGlobe) tabGlobe.classList.add('active');
      if (tabRadar) tabRadar.classList.remove('active');
      const loc = WeatherData.currentLocation;
      if (GlobeModule.initialized) GlobeModule.focusOn(loc.lat, loc.lon);
    } else {
      globeContainer.classList.add('hidden');
      radarContainer.classList.remove('hidden');
      if (globeLayerControls) globeLayerControls.classList.add('hidden');
      if (tabGlobe) tabGlobe.classList.remove('active');
      if (tabRadar) tabRadar.classList.add('active');
      const loc = WeatherData.currentLocation;
      setTimeout(() => {
        if (RadarModule.initialized) RadarModule.centreOn(loc.lat, loc.lon);
      }, 100);
    }
  }

  function toggleCRT() {
    crtMode = !crtMode;
    document.body.classList.toggle('crt-mode', crtMode);
    const btn = document.getElementById('crt-toggle');
    if (btn) btn.classList.toggle('active', crtMode);
  }

  function toggleUnits() {
    WeatherData.useFahrenheit = !WeatherData.useFahrenheit;
    const btn = document.getElementById('units-toggle');
    if (btn) btn.textContent = WeatherData.useFahrenheit ? '°F/°C' : '°C/°F';
    if (lastWeather) updateWeatherDisplay(lastWeather);
    if (forecastData) {
      renderHourlyForecast(forecastData);
      renderDailyForecast(forecastData);
      updateCharts(forecastData);
    }
  }

  async function loadWeather(lat, lon, name) {
    const statusEl = document.getElementById('data-status');
    if (statusEl) statusEl.textContent = '● LOADING';

    const locEl = document.getElementById('location-name');
    if (locEl) locEl.textContent = name || 'UNKNOWN';

    try {
      const [weather, forecast, alerts] = await Promise.all([
        WeatherData.fetchWeather(lat, lon),
        WeatherData.fetchForecast(lat, lon),
        WeatherData.fetchAlerts(lat, lon)
      ]);

      updateWeatherDisplay(weather);
      forecastData = forecast;
      renderHourlyForecast(forecast);
      renderDailyForecast(forecast);
      updateCharts(forecast);

      if (alerts && alerts.length > 0) {
        alerts.forEach(alert => {
          const msg = (alert.properties && alert.properties.title) || alert.title || 'WEATHER ALERT';
          TickerModule.addAlert(msg);
        });
      }

      if (statusEl) statusEl.textContent = '● LIVE';
    } catch (e) {
      console.error('Load weather failed:', e);
      if (statusEl) statusEl.textContent = '● ERROR';
    }
  }

  function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');
    if (timeEl) {
      timeEl.textContent =
        now.getUTCHours().toString().padStart(2,'0') + ':' +
        now.getUTCMinutes().toString().padStart(2,'0') + ':' +
        now.getUTCSeconds().toString().padStart(2,'0');
    }
    if (dateEl) {
      dateEl.textContent = `${DAYS[now.getUTCDay()]} ${now.getUTCDate().toString().padStart(2,'0')} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()} UTC`;
    }
  }

  async function init() {
    updateClock();
    setInterval(updateClock, 1000);

    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const crtBtn = document.getElementById('crt-toggle');
    if (crtBtn) crtBtn.addEventListener('click', toggleCRT);
    const unitsBtn = document.getElementById('units-toggle');
    if (unitsBtn) unitsBtn.addEventListener('click', toggleUnits);

    // Location pin button — centres globe on current/default location
    const locBtn = document.getElementById('location-btn');
    if (locBtn) locBtn.addEventListener('click', () => {
      const loc = WeatherData.currentLocation;
      if (GlobeModule.initialized) {
        GlobeModule.focusOn(loc.lat, loc.lon);
      }
      if (currentView === 'radar' && RadarModule.initialized) {
        RadarModule.centreOn(loc.lat, loc.lon);
      }
      if (currentView !== 'globe') {
        switchView('globe');
      }
    });

    // View tabs (GLOBE / RADAR)
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Forecast tabs (HRLY / 10-DAY)
    document.querySelectorAll('[data-forecast]').forEach(btn => {
      btn.addEventListener('click', () => showForecast(btn.dataset.forecast));
    });

    // Layer toggle buttons (CLOUDS, STORMS, etc.)
    document.querySelectorAll('[data-layer]').forEach(btn => {
      btn.addEventListener('click', () => GlobeModule.toggleLayer(btn.dataset.layer));
    });

    // Radar control buttons
    document.querySelectorAll('[data-radar-layer]').forEach(btn => {
      btn.addEventListener('click', () => RadarModule.changeLayer(btn.dataset.radarLayer));
    });
    const radarPlayBtn = document.querySelector('[data-radar-action="toggle-play"]');
    if (radarPlayBtn) radarPlayBtn.addEventListener('click', () => RadarModule.togglePlay());

    await WeatherData.fetchConfig();
    const location = await WeatherData.getLocation();
    const locEl = document.getElementById('location-name');
    if (locEl) locEl.textContent = location.name;

    await loadWeather(location.lat, location.lon, location.name);

    GlobeModule.init('globe-inner');
    RadarModule.init('radar-map');
    TickerModule.init('ticker-content');
    initCharts();
    initSearch();

    if (forecastData) updateCharts(forecastData);

    // Auto-refresh every 10 minutes
    setInterval(async () => {
      const loc = WeatherData.currentLocation;
      await loadWeather(loc.lat, loc.lon, loc.name);
    }, 10 * 60 * 1000);
  }

  // ── Location Search ──────────────────────────────────────────────────
  let searchDebounce = null;

  function initSearch() {
    const input = document.getElementById('search-input');
    const resultsEl = document.getElementById('search-results');
    if (!input || !resultsEl) return;

    input.addEventListener('input', () => {
      const query = input.value.trim();
      if (searchDebounce) clearTimeout(searchDebounce);
      if (query.length < 2) {
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
        return;
      }
      searchDebounce = setTimeout(() => searchLocation(query), 350);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        resultsEl.classList.add('hidden');
        input.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-wrapper')) {
        resultsEl.classList.add('hidden');
      }
    });
  }

  async function searchLocation(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;

    try {
      const encoded = encodeURIComponent(query);
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=5&language=en`
      );
      if (!res.ok) return;

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        resultsEl.innerHTML = '<div class="search-result-item"><span class="result-detail">NO RESULTS FOUND</span></div>';
        resultsEl.classList.remove('hidden');
        return;
      }

      resultsEl.innerHTML = '';
      data.results.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const country = loc.country || '';
        const admin = loc.admin1 || '';
        const detail = [admin, country].filter(Boolean).join(', ');
        item.innerHTML = `<div class="result-name">📍 ${loc.name}</div><div class="result-detail">${detail} (${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)})</div>`;

        item.addEventListener('click', () => {
          selectSearchResult(loc);
          resultsEl.classList.add('hidden');
        });

        resultsEl.appendChild(item);
      });
      resultsEl.classList.remove('hidden');
    } catch (e) {
      console.warn('Search failed:', e);
    }
  }

  function selectSearchResult(loc) {
    const input = document.getElementById('search-input');
    if (input) input.value = loc.name;

    WeatherData.currentLocation = { lat: loc.latitude, lon: loc.longitude, name: loc.name };

    if (GlobeModule.initialized) {
      GlobeModule.focusOn(loc.latitude, loc.longitude);
    }

    loadWeather(loc.latitude, loc.longitude, loc.name);
  }

  // Global function exports for inline onclick handlers
  window.switchView      = switchView;
  window.toggleRadarPlay = () => RadarModule.togglePlay();
  window.changeRadarLayer = (type) => RadarModule.changeLayer(type);
  window.toggleGlobeLayer = (layer) => GlobeModule.toggleLayer(layer);
  window.showForecast    = showForecast;

  document.addEventListener('DOMContentLoaded', init);

  return { loadWeather, switchView };
})();
