// WeatherByWatz - 3D Globe Module
const GlobeModule = (() => {
  let globe;
  let initialized = false;
  let layers = {
    clouds: true, storms: true, lightning: true,
    hurricanes: true, aurora: true, sunlight: true, flights: false,
    earthquakes: true, volcanoes: true, oceans: true, temperature: false
  };

  // Weather effect state
  const THUNDER_CODES = [95, 96, 99];
  const SEVERE_CODES = [65, 82, 95, 96, 99];
  const MAX_WIND_ARCS = 50;
  const MAX_ANIMATED_ELEMENTS = 250;
  const RADAR_REFRESH_MS = 120000;
  let stormCities = [];
  let windData = {};
  let windArcs = [];
  let cloudMesh = null;
  let lightningTimer = null;
  let radarTimer = null;

  // New feature state
  let hurricaneArcs = [];
  let auroraParticles = [];
  let flightArcs = [];
  let earthquakeData = [];
  let volcanoPoints = [];
  let oceanArcs = [];
  let temperatureGrid = [];
  let sunlightMesh = null;
  let sunlightTimer = null;
  let auroraAnimFrame = null;
  let atmosphereGlowMesh = null;

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

  // --- Sample Hurricane/Cyclone Tracks ---
  const SAMPLE_HURRICANES = [
    {
      name: 'HURRICANE MARIA',
      track: [
        { lat: 14.5, lon: -45.2 },
        { lat: 16.1, lon: -48.0 },
        { lat: 18.2, lon: -52.5 },
        { lat: 21.0, lon: -58.0 },
        { lat: 24.5, lon: -63.0 }
      ]
    },
    {
      name: 'TYPHOON HAIYAN',
      track: [
        { lat: 6.0, lon: 155.0 },
        { lat: 8.5, lon: 148.0 },
        { lat: 11.0, lon: 138.0 },
        { lat: 13.5, lon: 128.0 },
        { lat: 16.0, lon: 120.0 }
      ]
    },
    {
      name: 'CYCLONE IDAI',
      track: [
        { lat: -12.0, lon: 47.0 },
        { lat: -14.5, lon: 43.0 },
        { lat: -17.0, lon: 39.0 },
        { lat: -19.5, lon: 35.0 }
      ]
    },
    {
      name: 'HURRICANE DORIAN',
      track: [
        { lat: 15.0, lon: -55.0 },
        { lat: 18.0, lon: -60.0 },
        { lat: 22.0, lon: -68.0 },
        { lat: 26.3, lon: -77.0 },
        { lat: 30.0, lon: -79.5 }
      ]
    }
  ];

  // --- Sample Volcano Locations ---
  const SAMPLE_VOLCANOES = [
    { name: 'Etna', lat: 37.751, lon: 14.993 },
    { name: 'Vesuvius', lat: 40.821, lon: 14.426 },
    { name: 'Kilauea', lat: 19.421, lon: -155.287 },
    { name: 'Mount Fuji', lat: 35.361, lon: 138.727 },
    { name: 'Eyjafjallajokull', lat: 63.633, lon: -19.621 },
    { name: 'Pinatubo', lat: 15.143, lon: 120.350 },
    { name: 'Krakatoa', lat: -6.102, lon: 105.423 },
    { name: 'Mount St. Helens', lat: 46.191, lon: -122.196 },
    { name: 'Popocatepetl', lat: 19.023, lon: -98.628 },
    { name: 'Sakurajima', lat: 31.581, lon: 130.657 },
    { name: 'Stromboli', lat: 38.789, lon: 15.213 },
    { name: 'Merapi', lat: -7.541, lon: 110.446 }
  ];

  // --- Sample Flight Routes ---
  const SAMPLE_FLIGHTS = [
    { startLat: 51.47, startLng: -0.45, endLat: 40.64, endLng: -73.78 },
    { startLat: 25.25, startLng: 55.36, endLat: 1.35, endLng: 103.99 },
    { startLat: 35.76, startLng: 140.39, endLat: 33.94, endLng: -118.41 },
    { startLat: -33.95, startLng: 151.18, endLat: 51.47, endLng: -0.45 },
    { startLat: 49.01, startLng: 2.55, endLat: 22.31, endLng: 113.91 },
    { startLat: 40.64, startLng: -73.78, endLat: 25.79, endLng: -80.29 },
    { startLat: 52.56, startLng: 13.29, endLat: 35.76, endLng: 140.39 },
    { startLat: 55.97, startLng: 37.41, endLat: 25.25, endLng: 55.36 },
    { startLat: -23.43, startLng: -46.47, endLat: 6.58, endLng: 3.32 },
    { startLat: 19.44, startLng: -99.07, endLat: 40.64, endLng: -73.78 }
  ];

  // --- Ocean Current Paths ---
  const SAMPLE_OCEAN_CURRENTS = [
    { startLat: 25.0, startLng: -80.0, endLat: 35.0, endLng: -75.0 },
    { startLat: 35.0, startLng: -75.0, endLat: 45.0, endLng: -50.0 },
    { startLat: 45.0, startLng: -50.0, endLat: 55.0, endLng: -20.0 },
    { startLat: 20.0, startLng: 125.0, endLat: 30.0, endLng: 135.0 },
    { startLat: 30.0, startLng: 135.0, endLat: 38.0, endLng: 145.0 },
    { startLat: 38.0, startLng: 145.0, endLat: 42.0, endLng: 160.0 },
    { startLat: -55.0, startLng: -60.0, endLat: -58.0, endLng: 0.0 },
    { startLat: -58.0, startLng: 0.0, endLat: -55.0, endLng: 60.0 },
    { startLat: -55.0, startLng: 60.0, endLat: -58.0, endLng: 120.0 },
    { startLat: -58.0, startLng: 120.0, endLat: -55.0, endLng: 180.0 },
    { startLat: -25.0, startLng: 35.0, endLat: -35.0, endLng: 28.0 },
    { startLat: -35.0, startLng: 18.0, endLat: -20.0, endLng: 12.0 },
    { startLat: 55.0, startLng: -20.0, endLat: 65.0, endLng: 5.0 }
  ];

  // --- Sample Earthquake Data (fallback when USGS not reachable) ---
  const SAMPLE_EARTHQUAKES = [
    { lat: 35.68, lon: 139.69, mag: 3.2, place: 'Near Tokyo' },
    { lat: 37.77, lon: -122.42, mag: 2.5, place: 'San Francisco Bay' },
    { lat: -34.61, lon: -58.38, mag: 2.8, place: 'Buenos Aires Region' },
    { lat: 28.39, lon: 84.12, mag: 4.1, place: 'Nepal' },
    { lat: -6.17, lon: 106.83, mag: 3.5, place: 'Java, Indonesia' },
    { lat: 38.72, lon: 20.72, mag: 2.9, place: 'Greece' },
    { lat: 36.23, lon: 44.01, mag: 3.0, place: 'Iraq-Iran Border' },
    { lat: -22.91, lon: -43.17, mag: 2.2, place: 'Rio de Janeiro Region' }
  ];

  // --- Helper: Temperature to Color ---
  function tempToColor(t) {
    if (t < 0) return '#3b82f6';
    if (t < 10) return '#22c55e';
    if (t < 20) return '#eab308';
    return '#ef4444';
  }

  // --- Helper: Sun Position ---
  function getSunPosition() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((now - start) / 86400000);
    var declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
    var hours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    var lon = -(hours / 24) * 360 + 180;
    return { lat: declination, lon: lon };
  }

  // --- Helper: Lat/Lon to 3D Vector ---
  function latLonToVec3(lat, lon, THREE) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
  }

  // =============================================
  // INITIALIZATION
  // =============================================
  function init(containerId) {
    const el = document.getElementById(containerId);
    if (!el || initialized) return;

    try {
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
        .atmosphereAltitude(0.15)
        .pointsData(MAJOR_CITIES)
        .pointLat('lat')
        .pointLng('lon')
        .pointColor(d => {
          if (d.type === 'aurora') return ['#00ff88','#a855f7','#00e5ff'][d.colorIdx || 0];
          if (d.type === 'volcano') return '#ff4500';
          if (d.type === 'temperature') return tempToColor(d.temp);
          return '#00e5ff';
        })
        .pointAltitude(d => {
          if (d.type === 'aurora') return 0.05;
          if (d.type === 'volcano') return 0.04;
          if (d.type === 'temperature') return 0.02;
          return 0.01;
        })
        .pointRadius(d => {
          if (d.type === 'aurora') return 0.15;
          if (d.type === 'volcano') return 0.35;
          if (d.type === 'temperature') return 0.25;
          return 0.3;
        })
        .pointLabel(d => {
          if (d.type === 'volcano') {
            return '<div style="font-family:\'VT323\',monospace;background:rgba(5,8,16,0.92);border:1px solid #ff4500;padding:6px 10px;color:#ff4500;font-size:14px;">\uD83C\uDF0B ' + d.name + '</div>';
          }
          if (d.type && d.type !== 'city') return '';
          const weather = cityWeatherData[d.name];
          const temp = weather ? weather.temp.toFixed(1) + '\u00B0C' : 'CLICK FOR WEATHER';
          const cond = weather ? weather.desc : '';
          return '<div style="font-family:\'VT323\',monospace;background:rgba(5,8,16,0.92);border:1px solid #00e5ff;padding:8px 12px;color:#00e5ff;font-size:16px;min-width:120px;">'
            + '<div style="color:#ffb300;font-size:14px;margin-bottom:4px;">\uD83D\uDCCD ' + d.name + '</div>'
            + '<div style="color:#00e5ff;">' + temp + '</div>'
            + (cond ? '<div style="color:#00ff41;font-size:13px;">' + cond + '</div>' : '')
            + '</div>';
        })
        .onPointClick(d => {
          if (d.type && d.type !== 'city') return;
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
      if (statusEl) statusEl.textContent = '\u25CF ONLINE';

      window.addEventListener('resize', () => {
        if (globe && el) {
          globe.width(el.offsetWidth || 600).height(el.offsetHeight || 400);
        }
      });

      loadCityWeatherSamples();
    } catch (e) {
      console.error('Globe init failed:', e);
      if (el) {
        el.innerHTML = '<div style="color:#00e5ff;font-family:VT323,monospace;font-size:1.5rem;display:flex;align-items:center;justify-content:center;height:100%;padding:20px;text-align:center;">\uD83C\uDF0D GLOBE RENDERER<br>INITIALISING...<br><small style="color:#004d00;font-size:1rem;">WebGL required</small></div>';
      }
    }
  }

  // =============================================
  // CITY WEATHER LOADING
  // =============================================
  async function loadCityWeatherSamples() {
    stormCities = [];
    windArcs = [];

    const promises = MAJOR_CITIES.map(async city => {
      try {
        const res = await fetch('/api/weather?lat=' + city.lat + '&lon=' + city.lon);
        if (!res.ok) return;

        const data = await res.json();

        if (data.current) {
          const code = data.current.weather_code;
          const wmo = WeatherData.WMO_CODES[code] || { desc: 'UNKNOWN', emoji: '\uD83C\uDF21' };

          cityWeatherData[city.name] = {
            temp: data.current.temperature_2m,
            desc: wmo.desc,
            emoji: wmo.emoji
          };

          if (SEVERE_CODES.includes(code)) {
            stormCities.push({ lat: city.lat, lon: city.lon, name: city.name, code });
          }

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

    updatePointsDisplay();
    startWeatherEffects();
  }

  function updateCityWeather(name, temp, desc) {
    cityWeatherData[name] = { temp, desc };
    updatePointsDisplay();
  }

  function focusOn(lat, lon) {
    if (globe) {
      globe.pointOfView({ lat, lng: lon, altitude: 2 }, 1000);
    }
  }

  function addStormMarkers(storms) {
    if (!globe || !layers.storms) return;
    stormCities = storms.map(s => ({ lat: s.lat, lon: s.lon, name: s.name || '', code: s.code || 0 }));
    updateRingsDisplay();
  }

  // =============================================
  // UNIFIED DISPLAY MANAGERS
  // =============================================

  // --- Collect all non-temporary arcs ---
  function getBaseArcs() {
    var arcs = [];
    if (layers.storms) arcs = arcs.concat(windArcs);
    if (layers.hurricanes) arcs = arcs.concat(hurricaneArcs);
    if (layers.flights) arcs = arcs.concat(flightArcs);
    if (layers.oceans) arcs = arcs.concat(oceanArcs);
    return arcs.slice(0, MAX_ANIMATED_ELEMENTS);
  }

  // --- Shared Arc Display (all arc types) ---
  function updateArcsDisplay(arcs) {
    if (!globe) return;
    globe.arcsData(arcs)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor(d => d.color || '#00e5ff')
      .arcStroke(d => d.stroke || 0.5)
      .arcDashLength(d => {
        if (d.type === 'lightning') return 0.4;
        if (d.type === 'hurricane') return 0.4;
        if (d.type === 'flight') return 0.3;
        if (d.type === 'ocean') return 0.4;
        return 0.6;
      })
      .arcDashGap(d => {
        if (d.type === 'lightning') return 0.2;
        if (d.type === 'hurricane') return 0.1;
        if (d.type === 'flight') return 0.2;
        if (d.type === 'ocean') return 0.2;
        return 0.1;
      })
      .arcDashAnimateTime(d => {
        if (d.type === 'lightning') return 500;
        if (d.type === 'hurricane') return 4000;
        if (d.type === 'flight') return 5000;
        if (d.type === 'ocean') return 6000;
        return 2000;
      })
      .arcAltitude(d => {
        if (d.type === 'lightning') return 0;
        if (d.type === 'hurricane') return 0.25;
        if (d.type === 'flight') return 0.2;
        if (d.type === 'ocean') return 0.15;
        return 0.15;
      });
  }

  // --- Unified Points Display ---
  function updatePointsDisplay() {
    if (!globe) return;
    var points = MAJOR_CITIES.slice();
    if (layers.aurora) points = points.concat(auroraParticles);
    if (layers.volcanoes) points = points.concat(volcanoPoints);
    if (layers.temperature) points = points.concat(temperatureGrid);
    globe.pointsData(points);
  }

  // --- Unified Rings Display ---
  function updateRingsDisplay() {
    if (!globe) return;
    var rings = [];
    if (layers.storms && stormCities.length > 0) {
      rings = rings.concat(stormCities.map(c => ({
        lat: c.lat, lon: c.lon, type: 'storm', name: c.name
      })));
    }
    if (layers.earthquakes && earthquakeData.length > 0) {
      rings = rings.concat(earthquakeData.map(e => ({
        lat: e.lat, lon: e.lon, type: 'earthquake', mag: e.mag, place: e.place
      })));
    }
    globe.ringsData(rings)
      .ringLat('lat')
      .ringLng('lon')
      .ringColor(d => {
        if (d.type === 'earthquake') return t => 'rgba(255,120,0,' + (1-t) + ')';
        return t => 'rgba(255,0,0,' + (1-t) + ')';
      })
      .ringMaxRadius(d => {
        if (d.type === 'earthquake') return (d.mag || 2) * 2;
        return 6;
      })
      .ringPropagationSpeed(d => {
        if (d.type === 'earthquake') return 1.2;
        return 1;
      })
      .ringRepeatPeriod(800);
  }

  // =============================================
  // LIGHTNING STRIKES
  // =============================================
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

    updateArcsDisplay([...getBaseArcs(), lightningArc]);

    setTimeout(() => {
      updateArcsDisplay(getBaseArcs());
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

  // =============================================
  // WIND PARTICLES
  // =============================================
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

    return arcs.slice(0, MAX_WIND_ARCS);
  }

  function updateWindParticles() {
    windArcs = buildWindArcs();
    updateArcsDisplay(getBaseArcs());
  }

  // =============================================
  // 3D CLOUD LAYER
  // =============================================
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

  // =============================================
  // RAIN RADAR OVERLAY
  // =============================================
  function loadRadarOverlay() {
    if (!globe || !layers.storms) return;

    fetch('/api/rainviewer')
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data || !data.radar || !data.radar.past || data.radar.past.length === 0) return;

        const latest = data.radar.past[data.radar.past.length - 1];
        const radarUrl = 'https://tilecache.rainviewer.com' + latest.path + '/256/0/0/0/2/1_1.png';

        try {
          const scene = globe.scene();
          const THREE = window.THREE;
          if (!scene || !THREE) return;

          const loader = new THREE.TextureLoader();
          loader.crossOrigin = 'anonymous';
          loader.load(radarUrl, function (texture) {
            const existing = scene.getObjectByName('radarOverlay');
            if (existing) scene.remove(existing);

            const geometry = new THREE.SphereGeometry(100.8, 64, 64);
            const material = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              opacity: 0.35,
              depthWrite: false,
              side: THREE.FrontSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = 'radarOverlay';
            scene.add(mesh);
          });
        } catch (e) {
          console.warn('Radar overlay failed:', e);
        }
      })
      .catch(function () {});
  }

  // =============================================
  // FEATURE: HURRICANE / CYCLONE TRACKING
  // =============================================
  function initHurricanes() {
    if (!layers.hurricanes) { hurricaneArcs = []; return; }

    hurricaneArcs = [];
    SAMPLE_HURRICANES.forEach(storm => {
      for (var i = 0; i < storm.track.length - 1; i++) {
        hurricaneArcs.push({
          startLat: storm.track[i].lat,
          startLng: storm.track[i].lon,
          endLat: storm.track[i + 1].lat,
          endLng: storm.track[i + 1].lon,
          color: '#ff0055',
          stroke: 1.5,
          type: 'hurricane',
          name: storm.name
        });
      }
    });

    updateArcsDisplay(getBaseArcs());

    // Add spinning storm markers at the last track point of each hurricane
    try {
      var scene = globe.scene();
      var THREE = window.THREE;
      if (!scene || !THREE) return;

      SAMPLE_HURRICANES.forEach(storm => {
        var last = storm.track[storm.track.length - 1];
        var phi = (90 - last.lat) * Math.PI / 180;
        var theta = (last.lon + 180) * Math.PI / 180;
        var R = 101.5;

        var geometry = new THREE.RingGeometry(0.8, 1.5, 16);
        var material = new THREE.MeshBasicMaterial({
          color: 0xff0055,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        var ring = new THREE.Mesh(geometry, material);

        ring.position.set(
          -R * Math.sin(phi) * Math.cos(theta),
          R * Math.cos(phi),
          R * Math.sin(phi) * Math.sin(theta)
        );
        ring.lookAt(0, 0, 0);
        ring.name = 'hurricaneMarker_' + storm.name;
        scene.add(ring);

        (function animateStorm(r) {
          if (!r || !r.parent) return;
          r.rotation.z += 0.02;
          requestAnimationFrame(function() { animateStorm(r); });
        })(ring);
      });
    } catch (e) {
      console.warn('Hurricane markers failed:', e);
    }
  }

  // =============================================
  // FEATURE: AURORA BOREALIS VISUALIZATION
  // =============================================
  function initAurora() {
    if (!layers.aurora) { auroraParticles = []; return; }

    var colors = ['#00ff88', '#a855f7', '#00e5ff'];
    auroraParticles = [];

    // Northern aurora band: 60-75 latitude
    for (var i = 0; i < 120; i++) {
      auroraParticles.push({
        lat: 60 + Math.random() * 15,
        lon: Math.random() * 360 - 180,
        type: 'aurora',
        colorIdx: Math.floor(Math.random() * 3)
      });
    }

    // Southern aurora band: -60 to -75 latitude
    for (var j = 0; j < 80; j++) {
      auroraParticles.push({
        lat: -(60 + Math.random() * 15),
        lon: Math.random() * 360 - 180,
        type: 'aurora',
        colorIdx: Math.floor(Math.random() * 3)
      });
    }

    updatePointsDisplay();
    startAuroraAnimation();
  }

  function startAuroraAnimation() {
    if (auroraAnimFrame) cancelAnimationFrame(auroraAnimFrame);

    var lastTime = 0;
    function animate(time) {
      if (!layers.aurora) { auroraAnimFrame = null; return; }
      if (time - lastTime > 2000) {
        lastTime = time;
        for (var i = 0; i < auroraParticles.length; i++) {
          auroraParticles[i].lon += 0.3;
          if (auroraParticles[i].lon > 180) auroraParticles[i].lon -= 360;
        }
        updatePointsDisplay();
      }
      auroraAnimFrame = requestAnimationFrame(animate);
    }
    auroraAnimFrame = requestAnimationFrame(animate);
  }

  // =============================================
  // FEATURE: DAY/NIGHT SUNLIGHT SHADING
  // =============================================
  function initSunlightLayer() {
    if (!globe || !layers.sunlight) return;

    try {
      var scene = globe.scene();
      var THREE = window.THREE;
      if (!scene || !THREE) return;

      var vertexShader = [
        'varying vec3 vWorldNormal;',
        'void main() {',
        '  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n');

      var fragmentShader = [
        'uniform vec3 uSunDir;',
        'varying vec3 vWorldNormal;',
        'void main() {',
        '  float intensity = dot(normalize(vWorldNormal), normalize(uSunDir));',
        '  float shadow = smoothstep(-0.15, 0.15, intensity);',
        '  gl_FragColor = vec4(0.0, 0.0, 0.03, (1.0 - shadow) * 0.55);',
        '}'
      ].join('\n');

      var material = new THREE.ShaderMaterial({
        uniforms: {
          uSunDir: { value: new THREE.Vector3(1, 0, 0) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide
      });

      var geometry = new THREE.SphereGeometry(100.5, 64, 64);
      sunlightMesh = new THREE.Mesh(geometry, material);
      sunlightMesh.name = 'sunlightOverlay';
      scene.add(sunlightMesh);

      updateSunPosition();
      sunlightTimer = setInterval(updateSunPosition, 60000);
    } catch (e) {
      console.warn('Sunlight layer init failed:', e);
    }
  }

  function updateSunPosition() {
    if (!sunlightMesh) return;
    var THREE = window.THREE;
    if (!THREE) return;
    var sun = getSunPosition();
    var dir = latLonToVec3(sun.lat, sun.lon, THREE);
    sunlightMesh.material.uniforms.uSunDir.value.copy(dir);
  }

  // =============================================
  // FEATURE: LIVE AIRCRAFT WEATHER PATHS
  // =============================================
  function initFlights() {
    if (!layers.flights) { flightArcs = []; return; }

    flightArcs = SAMPLE_FLIGHTS.map(f => ({
      startLat: f.startLat,
      startLng: f.startLng,
      endLat: f.endLat,
      endLng: f.endLng,
      color: '#00e5ff',
      stroke: 0.8,
      type: 'flight'
    }));

    // Add turbulence markers near high-wind cities
    Object.keys(windData).forEach(name => {
      var w = windData[name];
      if (w && w.speed > 30) {
        flightArcs.push({
          startLat: w.lat - 0.5,
          startLng: w.lon - 0.5,
          endLat: w.lat + 0.5,
          endLng: w.lon + 0.5,
          color: '#ff6600',
          stroke: 1.0,
          type: 'flight'
        });
      }
    });

    updateArcsDisplay(getBaseArcs());
  }

  // =============================================
  // FEATURE: CINEMATIC ATMOSPHERE GLOW
  // =============================================
  function initAtmosphereGlow() {
    if (!globe) return;

    try {
      var scene = globe.scene();
      var THREE = window.THREE;
      if (!scene || !THREE) return;

      var geometry = new THREE.SphereGeometry(115, 64, 64);
      var material = new THREE.MeshBasicMaterial({
        color: 0x4fd1ff,
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
        side: THREE.BackSide
      });
      atmosphereGlowMesh = new THREE.Mesh(geometry, material);
      atmosphereGlowMesh.name = 'atmosphereGlow';
      scene.add(atmosphereGlowMesh);
    } catch (e) {
      console.warn('Atmosphere glow init failed:', e);
    }
  }

  // =============================================
  // FEATURE: GLOBAL TEMPERATURE HEATMAP
  // =============================================
  function initTemperatureGrid() {
    if (!layers.temperature) { temperatureGrid = []; return; }

    temperatureGrid = [];
    for (var lat = -80; lat <= 80; lat += 10) {
      for (var lon = -180; lon < 180; lon += 12) {
        var baseTemp = 30 - Math.abs(lat) * 0.6;
        var variation = (Math.sin(lon * 0.05) + Math.cos(lat * 0.1)) * 5;
        temperatureGrid.push({
          lat: lat + Math.random() * 4 - 2,
          lon: lon + Math.random() * 4 - 2,
          temp: baseTemp + variation + (Math.random() * 6 - 3),
          type: 'temperature'
        });
      }
    }

    updatePointsDisplay();
  }

  // =============================================
  // FEATURE: EARTHQUAKE LIVE FEED
  // =============================================
  function initEarthquakes() {
    if (!layers.earthquakes) { earthquakeData = []; return; }

    // Attempt to fetch live data from USGS (may be blocked by CSP)
    fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
      .then(function(res) { return res.ok ? res.json() : null; })
      .then(function(data) {
        if (data && data.features && data.features.length > 0) {
          earthquakeData = data.features.map(function(f) {
            return {
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              mag: f.properties.mag || 2,
              place: f.properties.place || 'Unknown'
            };
          });
        } else {
          earthquakeData = SAMPLE_EARTHQUAKES.slice();
        }
        updateRingsDisplay();
      })
      .catch(function() {
        earthquakeData = SAMPLE_EARTHQUAKES.slice();
        updateRingsDisplay();
      });
  }

  // =============================================
  // FEATURE: ACTIVE VOLCANO MARKERS
  // =============================================
  function initVolcanoes() {
    if (!layers.volcanoes) { volcanoPoints = []; return; }

    volcanoPoints = SAMPLE_VOLCANOES.map(v => ({
      lat: v.lat,
      lon: v.lon,
      name: v.name,
      type: 'volcano'
    }));

    updatePointsDisplay();
  }

  // =============================================
  // FEATURE: OCEAN CURRENT FLOW
  // =============================================
  function initOceanCurrents() {
    if (!layers.oceans) { oceanArcs = []; return; }

    oceanArcs = SAMPLE_OCEAN_CURRENTS.map(c => ({
      startLat: c.startLat,
      startLng: c.startLng,
      endLat: c.endLat,
      endLng: c.endLng,
      color: '#00bfff',
      stroke: 0.6,
      type: 'ocean'
    }));

    updateArcsDisplay(getBaseArcs());
  }

  // =============================================
  // START ALL WEATHER EFFECTS
  // =============================================
  function startWeatherEffects() {
    // Existing effects
    updateRingsDisplay();
    startLightningCycle();
    updateWindParticles();
    initCloudLayer();
    loadRadarOverlay();
    if (radarTimer) clearInterval(radarTimer);
    radarTimer = setInterval(loadRadarOverlay, RADAR_REFRESH_MS);

    // New features
    initAtmosphereGlow();
    initHurricanes();
    initAurora();
    initSunlightLayer();
    initFlights();
    initEarthquakes();
    initVolcanoes();
    initOceanCurrents();
    initTemperatureGrid();
  }

  // =============================================
  // LAYER TOGGLE
  // =============================================
  function toggleLayer(layer, enabled) {
    layers[layer] = (enabled !== undefined) ? enabled : !layers[layer];
    const buttons = document.querySelectorAll('.layer-btn');
    buttons.forEach(btn => {
      const match = btn.getAttribute('onclick') && btn.getAttribute('onclick').match(/'(\w+)'/);
      if (match && match[1] === layer) {
        btn.classList.toggle('active', layers[layer]);
      }
    });

    // --- Storms ---
    if (layer === 'storms') {
      if (layers.storms) {
        updateRingsDisplay();
        updateWindParticles();
        loadRadarOverlay();
      } else {
        windArcs = [];
        updateArcsDisplay(getBaseArcs());
        updateRingsDisplay();
        try {
          const scene = globe.scene();
          const existing = scene && scene.getObjectByName('radarOverlay');
          if (existing) scene.remove(existing);
        } catch (e) {}
      }
    }

    // --- Lightning ---
    if (layer === 'lightning') {
      if (!layers.lightning && lightningTimer) {
        clearInterval(lightningTimer);
        lightningTimer = null;
        updateArcsDisplay(getBaseArcs());
      } else if (layers.lightning && stormCities.length > 0) {
        startLightningCycle();
      }
    }

    // --- Clouds ---
    if (layer === 'clouds' && cloudMesh) {
      cloudMesh.visible = layers.clouds;
    }

    // --- Hurricanes ---
    if (layer === 'hurricanes') {
      if (layers.hurricanes) {
        initHurricanes();
      } else {
        hurricaneArcs = [];
        updateArcsDisplay(getBaseArcs());
        // Remove hurricane markers from scene
        try {
          var scene = globe.scene();
          if (scene) {
            SAMPLE_HURRICANES.forEach(s => {
              var marker = scene.getObjectByName('hurricaneMarker_' + s.name);
              if (marker) scene.remove(marker);
            });
          }
        } catch (e) {}
      }
    }

    // --- Aurora ---
    if (layer === 'aurora') {
      if (layers.aurora) {
        initAurora();
      } else {
        auroraParticles = [];
        if (auroraAnimFrame) { cancelAnimationFrame(auroraAnimFrame); auroraAnimFrame = null; }
        updatePointsDisplay();
      }
    }

    // --- Sunlight ---
    if (layer === 'sunlight') {
      if (sunlightMesh) {
        sunlightMesh.visible = layers.sunlight;
      }
      if (!layers.sunlight && sunlightTimer) {
        clearInterval(sunlightTimer);
        sunlightTimer = null;
      } else if (layers.sunlight && !sunlightMesh) {
        initSunlightLayer();
      } else if (layers.sunlight && sunlightTimer === null) {
        updateSunPosition();
        sunlightTimer = setInterval(updateSunPosition, 60000);
      }
    }

    // --- Flights ---
    if (layer === 'flights') {
      if (layers.flights) {
        initFlights();
      } else {
        flightArcs = [];
        updateArcsDisplay(getBaseArcs());
      }
    }

    // --- Earthquakes ---
    if (layer === 'earthquakes') {
      if (layers.earthquakes) {
        initEarthquakes();
      } else {
        earthquakeData = [];
        updateRingsDisplay();
      }
    }

    // --- Volcanoes ---
    if (layer === 'volcanoes') {
      if (layers.volcanoes) {
        initVolcanoes();
      } else {
        volcanoPoints = [];
        updatePointsDisplay();
      }
    }

    // --- Oceans ---
    if (layer === 'oceans') {
      if (layers.oceans) {
        initOceanCurrents();
      } else {
        oceanArcs = [];
        updateArcsDisplay(getBaseArcs());
      }
    }

    // --- Temperature ---
    if (layer === 'temperature') {
      if (layers.temperature) {
        initTemperatureGrid();
      } else {
        temperatureGrid = [];
        updatePointsDisplay();
      }
    }
  }

  return {
    init, focusOn, updateCityWeather, addStormMarkers, toggleLayer,
    get initialized() { return initialized; }
  };
})();
