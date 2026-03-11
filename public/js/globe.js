// WeatherByWatz - 3D Globe Module
const GlobeModule = (() => {
  let globe;
  let initialized = false;
  let layers = { clouds: true, storms: true, lightning: true };

  const MAJOR_CITIES = [
    { name: 'NEW YORK',    lat: 40.71,  lon: -74.01  },
    { name: 'LONDON',      lat: 51.51,  lon: -0.13   },
    { name: 'TOKYO',       lat: 35.68,  lon: 139.69  },
    { name: 'SYDNEY',      lat: -33.87, lon: 151.21  },
    { name: 'DUBAI',       lat: 25.20,  lon: 55.27   },
    { name: 'PARIS',       lat: 48.85,  lon: 2.35    },
    { name: 'MOSCOW',      lat: 55.75,  lon: 37.62   },
    { name: 'BEIJING',     lat: 39.90,  lon: 116.41  },
    { name: 'MUMBAI',      lat: 19.08,  lon: 72.88   },
    { name: 'SAO PAULO',   lat: -23.55, lon: -46.63  },
    { name: 'CAIRO',       lat: 30.04,  lon: 31.24   },
    { name: 'LAGOS',       lat: 6.52,   lon: 3.38    },
    { name: 'LOS ANGELES', lat: 34.05,  lon: -118.24 },
    { name: 'CHICAGO',     lat: 41.88,  lon: -87.63  },
    { name: 'TORONTO',     lat: 43.65,  lon: -79.38  },
    { name: 'BERLIN',      lat: 52.52,  lon: 13.40   },
    { name: 'SINGAPORE',   lat: 1.35,   lon: 103.82  },
    { name: 'MIAMI',       lat: 25.77,  lon: -80.19  },
    { name: 'SEATTLE',     lat: 47.61,  lon: -122.33 },
    { name: 'MEXICO CITY', lat: 19.43,  lon: -99.13  },
  ];

  let cityWeatherData = {};

  function init(containerId) {
    const el = document.getElementById(containerId);
    if (!el || initialized) return;

    try {
      // Globe.gl v2.27.2 exposes Globe as a global from CDN
      const GlobeFactory = window.Globe || (typeof Globe !== 'undefined' ? Globe : null);
      if (!GlobeFactory) {
        throw new Error('Globe.gl not loaded');
      }

      globe = GlobeFactory()(el)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .width(el.offsetWidth || 600)
        .height(el.offsetHeight || 400)
        .showAtmosphere(true)
        .atmosphereColor('#00e5ff')
        .atmosphereAltitude(0.1)
        .pointsData(MAJOR_CITIES)
        .pointLat('lat')
        .pointLng('lon')
        .pointColor(() => '#00e5ff')
        .pointAltitude(0.01)
        .pointRadius(0.3)
        .pointLabel(d => {
          const weather = cityWeatherData[d.name];
          const temp = weather ? `${weather.temp.toFixed(1)}°C` : 'CLICK FOR WEATHER';
          const cond = weather ? weather.desc : '';
          return `<div style="font-family:'VT323',monospace;background:rgba(5,8,16,0.92);border:1px solid #00e5ff;padding:8px 12px;color:#00e5ff;font-size:16px;min-width:120px;">
            <div style="color:#ffb300;font-size:14px;margin-bottom:4px;">📍 ${d.name}</div>
            <div style="color:#00e5ff;">${temp}</div>
            ${cond ? `<div style="color:#00ff41;font-size:13px;">${cond}</div>` : ''}
          </div>`;
        })
        .onPointClick(d => {
          WeatherData.currentLocation = { lat: d.lat, lon: d.lon, name: d.name };
          if (typeof App !== 'undefined') App.loadWeather(d.lat, d.lon, d.name);
          globe.pointOfView({ lat: d.lat, lng: d.lon, altitude: 2 }, 1000);
        })
        .labelsData(MAJOR_CITIES)
        .labelLat('lat')
        .labelLng('lon')
        .labelText('name')
        .labelSize(0.5)
        .labelColor(() => '#ffb300')
        .labelDotRadius(0.2)
        .labelResolution(2);

      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.3;

      initialized = true;

      const statusEl = document.getElementById('globe-status');
      if (statusEl) statusEl.textContent = '● ONLINE';

      window.addEventListener('resize', () => {
        if (globe && el) {
          globe.width(el.offsetWidth || 600).height(el.offsetHeight || 400);
        }
      });

      // Load weather for a few cities in the background
      loadCityWeatherSamples();
    } catch (e) {
      console.error('Globe init failed:', e);
      if (el) {
        el.innerHTML = '<div style="color:#00e5ff;font-family:VT323,monospace;font-size:1.5rem;display:flex;align-items:center;justify-content:center;height:100%;padding:20px;text-align:center;">🌍 GLOBE RENDERER<br>INITIALISING...<br><small style="color:#004d00;font-size:1rem;">WebGL required</small></div>';
      }
    }
  }

  async function loadCityWeatherSamples() {
    const sampleCities = MAJOR_CITIES.slice(0, 8);
    for (const city of sampleCities) {
      try {
        const res = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.current) {
            const code = data.current.weather_code;
            const wmo = WeatherData.WMO_CODES[code] || { desc: 'UNKNOWN', emoji: '🌡' };
            cityWeatherData[city.name] = {
              temp: data.current.temperature_2m,
              desc: wmo.desc,
              emoji: wmo.emoji
            };
          }
        }
      } catch (e) { /* silent fail */ }
    }
    // Refresh points to show updated labels
    if (globe) globe.pointsData([...MAJOR_CITIES]);
  }

  function updateCityWeather(name, temp, desc) {
    cityWeatherData[name] = { temp, desc };
    if (globe) globe.pointsData([...MAJOR_CITIES]);
  }

  function focusOn(lat, lon) {
    if (globe) {
      globe.pointOfView({ lat, lng: lon, altitude: 2 }, 1000);
    }
  }

  function addStormMarkers(storms) {
    if (!globe || !layers.storms) return;
    globe.ringsData(storms)
      .ringLat('lat')
      .ringLng('lon')
      .ringColor(() => t => `rgba(255,23,68,${1 - t})`)
      .ringMaxRadius(5)
      .ringPropagationSpeed(1)
      .ringRepeatPeriod(700);
  }

  function toggleLayer(layer, enabled) {
    layers[layer] = (enabled !== undefined) ? enabled : !layers[layer];
    const buttons = document.querySelectorAll('.layer-btn');
    buttons.forEach(btn => {
      const match = btn.getAttribute('onclick') && btn.getAttribute('onclick').match(/'(\w+)'/);
      if (match && match[1] === layer) {
        btn.classList.toggle('active', layers[layer]);
      }
    });
  }

  return {
    init, focusOn, updateCityWeather, addStormMarkers, toggleLayer,
    get initialized() { return initialized; }
  };
})();
