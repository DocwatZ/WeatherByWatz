// Weatherby - Radar Module
const RadarModule = (() => {
  let map;
  let radarLayer;
  let frames = [];
  let currentFrame = 0;
  let animating = true;
  let animInterval;
  let currentLayerType = 'radar';
  let initialized = false;

  function init(containerId) {
    if (initialized) return map;
    const el = document.getElementById(containerId);
    if (!el) return;

    map = L.map(containerId, {
      center: [30, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    initialized = true;
    loadRadarFrames();
    return map;
  }

  async function loadRadarFrames() {
    try {
      const response = await fetch('/api/rainviewer');
      const data = await response.json();
      if (data.radar && data.radar.past) {
        frames = data.radar.past.concat(data.radar.nowcast || []);
        if (frames.length > 0) {
          startAnimation();
          const radarContainer = document.getElementById('radar-container');
          const statusEl = document.getElementById('globe-status');
          if (statusEl && radarContainer && !radarContainer.classList.contains('hidden')) {
            statusEl.textContent = '● ONLINE';
          }
        }
      }
    } catch (e) {
      console.warn('RainViewer unavailable:', e);
    }
  }

  function startAnimation() {
    if (animInterval) clearInterval(animInterval);
    updateFrame(currentFrame);
    animInterval = setInterval(() => {
      if (!animating || frames.length === 0) return;
      currentFrame = (currentFrame + 1) % frames.length;
      updateFrame(currentFrame);
    }, 500);
  }

  function updateFrame(idx) {
    if (!frames[idx] || !map) return;
    const frame = frames[idx];

    if (radarLayer) {
      map.removeLayer(radarLayer);
      radarLayer = null;
    }

    let tileUrl;
    if (currentLayerType === 'radar') {
      tileUrl = `https://tilecache.rainviewer.com/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`;
    } else if (currentLayerType === 'satellite') {
      tileUrl = `https://tilecache.rainviewer.com/v2/satellite/${frame.time}/256/{z}/{x}/{y}/0/0_0.png`;
    } else if (currentLayerType === 'infrared') {
      tileUrl = `https://tilecache.rainviewer.com/v2/satellite/${frame.time}/256/{z}/{x}/{y}/1/1_1.png`;
    }

    if (tileUrl) {
      radarLayer = L.tileLayer(tileUrl, {
        opacity: currentLayerType === 'radar' ? 0.6 : 0.7,
        tileSize: 256,
        zIndex: 500
      });
      radarLayer.addTo(map);
    }

    const tsEl = document.getElementById('radar-timestamp');
    if (tsEl) {
      const ts = new Date(frame.time * 1000);
      const h = ts.getUTCHours().toString().padStart(2, '0');
      const m = ts.getUTCMinutes().toString().padStart(2, '0');
      const day = ts.toUTCString().substring(0, 3).toUpperCase();
      tsEl.textContent = `${day} ${h}:${m} UTC`;
    }
  }

  function togglePlay() {
    animating = !animating;
    const btn = document.getElementById('radar-play');
    if (btn) btn.textContent = animating ? '⏸ PAUSE' : '▶ PLAY';
  }

  function changeLayer(type) {
    currentLayerType = type;
    document.querySelectorAll('.radar-btn[data-radar-layer]').forEach(b => {
      b.classList.toggle('active', b.dataset.radarLayer === type);
    });
    // Keep play button active state separate
    const playBtn = document.getElementById('radar-play');
    if (playBtn) playBtn.classList.add('active');
    updateFrame(currentFrame);
  }

  function centreOn(lat, lon) {
    if (map) map.setView([lat, lon], 7);
  }

  return {
    init, togglePlay, changeLayer, centreOn, loadRadarFrames,
    get initialized() { return initialized; }
  };
})();
