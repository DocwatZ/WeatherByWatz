// WeatherByWatz - 3D Globe Module
const GlobeModule = (() => {
  let globe;
  let initialized = false;
  let layers = { clouds: true, storms: true, lightning: true };

  // Weather effect state
  const THUNDER_CODES = [95, 96, 99];
  const SEVERE_CODES = [65, 82, 95, 96, 99];
  let stormCities = [];
  let windData = {};
  let windArcs = [];
  let cloudMesh = null;
  let lightningTimer = null;
  let radarTimer = null;

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

      // Load weather for all cities in the background
      loadCityWeatherSamples();
    } catch (e) {
      console.error('Globe init failed:', e);
      if (el) {
        el.innerHTML = '<div style="color:#00e5ff;font-family:VT323,monospace;font-size:1.5rem;display:flex;align-items:center;justify-content:center;height:100%;padding:20px;text-align:center;">🌍 GLOBE RENDERER<br>INITIALISING...<br><small style="color:#004d00;font-size:1rem;">WebGL required</small></div>';
      }
    }
  }

  async function loadCityWeatherSamples() {
    stormCities = [];
    windArcs = [];

    const promises = MAJOR_CITIES.map(async city => {
      try {
        const res = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.current) {
          const code = data.current.weather_code;
          const wmo = WeatherData.WMO_CODES[code] || { desc: 'UNKNOWN', emoji: '🌡' };

          cityWeatherData[city.name] = {
            temp: data.current.temperature_2m,
            desc: wmo.desc,
            emoji: wmo.emoji
          };

          // Track storm cities for visual effects
          if (SEVERE_CODES.includes(code)) {
            stormCities.push({ lat: city.lat, lon: city.lon, name: city.name, code });
          }

          // Track wind data for particle visualization
          if (data.current.wind_speed_10m !== undefined) {
            windData[city.name] = {
              lat: city.lat,
              lon: city.lon,
              speed: data.current.wind_speed_10m,
              direction: data.current.wind_direction_10m || 0
            };
          }
        }
      } catch (err) {
        console.warn("City weather load failed:", city.name);
      }
    });

    await Promise.all(promises);

    if (globe) {
      globe.pointsData([...MAJOR_CITIES]);
    }

    // Activate visual weather effects
    startWeatherEffects();
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

  // --- Lightning Strikes ---
  function triggerLightning(lat, lon) {
    if (!globe || !layers.lightning) return;

    const lightningArc = {
      startLat: lat,
      startLng: lon,
      endLat: lat + (Math.random() * 0.5 - 0.25),
      endLng: lon + (Math.random() * 0.5 - 0.25),
      color: ['#ffff00', '#ffffff'],
      stroke: 1.5,
      type: 'lightning'
    };

    updateArcsDisplay([...windArcs, lightningArc]);

    // Remove lightning flash after 500ms
    setTimeout(() => {
      updateArcsDisplay([...windArcs]);
    }, 500);
  }

  function startLightningCycle() {
    if (lightningTimer) clearInterval(lightningTimer);
    if (stormCities.length === 0) return;

    lightningTimer = setInterval(() => {
      if (!layers.lightning || stormCities.length === 0) return;
      const city = stormCities[Math.floor(Math.random() * stormCities.length)];
      triggerLightning(city.lat, city.lon);
    }, 2000);
  }

  // --- Shared Arc Display (lightning + wind) ---
  function updateArcsDisplay(arcs) {
    if (!globe) return;
    globe.arcsData(arcs)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcStroke(d => d.stroke || 0.5)
      .arcDashLength(d => d.type === 'lightning' ? 0.4 : 0.6)
      .arcDashGap(d => d.type === 'lightning' ? 0.2 : 0.1)
      .arcDashAnimateTime(d => d.type === 'lightning' ? 500 : 2000)
      .arcAltitude(d => d.type === 'lightning' ? 0 : 0.15);
  }

  // --- Storm Rings ---
  function updateStormRings() {
    if (!globe || !layers.storms || stormCities.length === 0) {
      if (globe) globe.ringsData([]);
      return;
    }

    globe.ringsData(stormCities)
      .ringLat('lat')
      .ringLng('lon')
      .ringColor(() => t => `rgba(255,0,0,${1 - t})`)
      .ringMaxRadius(6)
      .ringPropagationSpeed(1)
      .ringRepeatPeriod(800);
  }

  // --- Wind Particles ---
  function buildWindArcs() {
    if (!layers.storms) return [];

    const arcs = [];
    Object.keys(windData).forEach(name => {
      const w = windData[name];
      if (!w || !w.speed) return;

      const rad = (w.direction * Math.PI) / 180;
      const dist = Math.min(w.speed / 10, 3);
      const endLat = w.lat + Math.cos(rad) * dist;
      const endLon = w.lon + Math.sin(rad) * dist;

      // Color scale: Blue (light) → Yellow (moderate) → Red (strong)
      let color;
      if (w.speed < 15) color = ['#2196f3', '#64b5f6'];
      else if (w.speed < 30) color = ['#ffeb3b', '#ffc107'];
      else color = ['#f44336', '#ff5722'];

      arcs.push({
        startLat: w.lat,
        startLng: w.lon,
        endLat,
        endLng: endLon,
        color,
        stroke: 0.3 + (w.speed / 50),
        type: 'wind'
      });
    });

    return arcs.slice(0, 50); // Limit for performance
  }

  function updateWindParticles() {
    windArcs = buildWindArcs();
    updateArcsDisplay([...windArcs]);
  }

  // --- 3D Cloud Layer ---
  function initCloudLayer() {
    if (!globe || !layers.clouds) return;

    try {
      const scene = globe.scene();
      const THREE = window.THREE;
      if (!scene || !THREE) return;

      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';
      loader.load(
        'https://unpkg.com/three-globe/example/img/earth-clouds.png',
        function (texture) {
          const geometry = new THREE.SphereGeometry(101, 64, 64);
          const material = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            opacity: 0.35,
            depthWrite: false
          });
          cloudMesh = new THREE.Mesh(geometry, material);
          cloudMesh.name = 'cloudLayer';
          scene.add(cloudMesh);

          // Slow cloud rotation animation
          (function animateClouds() {
            if (cloudMesh) {
              cloudMesh.visible = layers.clouds;
              cloudMesh.rotation.y += 0.0002;
            }
            requestAnimationFrame(animateClouds);
          })();
        },
        undefined,
        function () { console.warn('Cloud texture load failed'); }
      );
    } catch (e) {
      console.warn('Cloud layer init failed:', e);
    }
  }

  // --- Rain Radar Overlay ---
  function loadRadarOverlay() {
    if (!globe || !layers.storms) return;

    fetch('/api/rainviewer')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !data.radar || !data.radar.past || data.radar.past.length === 0) return;

        var latest = data.radar.past[data.radar.past.length - 1];
        var radarUrl = 'https://tilecache.rainviewer.com' + latest.path + '/256/0/0/0/2/1_1.png';

        try {
          var scene = globe.scene();
          var THREE = window.THREE;
          if (!scene || !THREE) return;

          var loader = new THREE.TextureLoader();
          loader.crossOrigin = 'anonymous';
          loader.load(radarUrl, function (texture) {
            var existing = scene.getObjectByName('radarOverlay');
            if (existing) scene.remove(existing);

            var geometry = new THREE.SphereGeometry(100.8, 64, 64);
            var material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              opacity: 0.35,
              depthWrite: false,
              side: THREE.FrontSide
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'radarOverlay';
            scene.add(mesh);
          });
        } catch (e) {
          console.warn('Radar overlay failed:', e);
        }
      })
      .catch(function () {});
  }

  // --- Start All Weather Effects ---
  function startWeatherEffects() {
    updateStormRings();
    startLightningCycle();
    updateWindParticles();
    initCloudLayer();

    loadRadarOverlay();
    if (radarTimer) clearInterval(radarTimer);
    radarTimer = setInterval(loadRadarOverlay, 120000);
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

    // Update visual effects based on layer state
    if (layer === 'storms') {
      if (layers.storms) {
        updateStormRings();
        updateWindParticles();
        loadRadarOverlay();
      } else {
        if (globe) globe.ringsData([]);
        windArcs = [];
        updateArcsDisplay([]);
        try {
          var scene = globe.scene();
          var existing = scene && scene.getObjectByName('radarOverlay');
          if (existing) scene.remove(existing);
        } catch (e) {}
      }
    }

    if (layer === 'lightning') {
      if (!layers.lightning && lightningTimer) {
        clearInterval(lightningTimer);
        lightningTimer = null;
        updateArcsDisplay([...windArcs]);
      } else if (layers.lightning && stormCities.length > 0) {
        startLightningCycle();
      }
    }

    if (layer === 'clouds' && cloudMesh) {
      cloudMesh.visible = layers.clouds;
    }
  }

  return {
    init, focusOn, updateCityWeather, addStormMarkers, toggleLayer,
    get initialized() { return initialized; }
  };
})();
