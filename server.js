'use strict';

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const CACHE_TTL = parseInt(process.env.CACHE_INTERVAL, 10) || 600;
const DEFAULT_LOCATION = process.env.DEFAULT_LOCATION || '51.5074,-0.1278';
const OPEN_METEO_BASE = process.env.OPEN_METEO_ENDPOINT || 'https://api.open-meteo.com/v1';
const RAINVIEWER_API = process.env.RAINVIEWER_API || 'https://api.rainviewer.com/public/weather-maps.json';
const SATELLITE_SOURCE = process.env.SATELLITE_SOURCE || 'GOES-EAST';

const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });

const app = express();

app.use(compression());

// Rate limiter — 200 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://unpkg.com',
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
      ],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api.open-meteo.com', 'https://api.rainviewer.com', 'https://api.met.no', 'https://tilecache.rainviewer.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Validators ────────────────────────────────────────────────────────────────
function validateLatLon(lat, lon) {
  const la = parseFloat(lat);
  const lo = parseFloat(lon);
  if (isNaN(la) || isNaN(lo)) return null;
  if (la < -90 || la > 90) return null;
  if (lo < -180 || lo > 180) return null;
  return { lat: la, lon: lo };
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/config
app.get('/api/config', (req, res) => {
  res.json({
    defaultLocation: DEFAULT_LOCATION,
    satelliteSource: SATELLITE_SOURCE,
    cacheInterval: CACHE_TTL,
    version: '1.0.0',
  });
});

// GET /api/weather?lat=&lon=
app.get('/api/weather', async (req, res) => {
  const coords = validateLatLon(req.query.lat, req.query.lon);
  if (!coords) {
    return res.status(400).json({ error: 'Invalid or missing lat/lon parameters' });
  }
  const { lat, lon } = coords;
  const cacheKey = `weather_${lat}_${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `${OPEN_METEO_BASE}/forecast`;
    const params = {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
      wind_speed_unit: 'mph',
      temperature_unit: 'celsius',
      timezone: 'auto',
    };
    const { data } = await axios.get(url, { params, timeout: 10000 });
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Weather API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch weather data' });
  }
});

// GET /api/forecast?lat=&lon=
app.get('/api/forecast', async (req, res) => {
  const coords = validateLatLon(req.query.lat, req.query.lon);
  if (!coords) {
    return res.status(400).json({ error: 'Invalid or missing lat/lon parameters' });
  }
  const { lat, lon } = coords;
  const cacheKey = `forecast_${lat}_${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `${OPEN_METEO_BASE}/forecast`;
    const params = {
      latitude: lat,
      longitude: lon,
      hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
      wind_speed_unit: 'mph',
      temperature_unit: 'celsius',
      timezone: 'auto',
      forecast_days: 10,
    };
    const { data } = await axios.get(url, { params, timeout: 10000 });
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Forecast API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch forecast data' });
  }
});

// GET /api/alerts?lat=&lon=
app.get('/api/alerts', async (req, res) => {
  const coords = validateLatLon(req.query.lat, req.query.lon);
  if (!coords) {
    return res.status(400).json({ error: 'Invalid or missing lat/lon parameters' });
  }
  const { lat, lon } = coords;
  const cacheKey = `alerts_${lat}_${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://api.met.no/weatherapi/metalerts/2.0/all.json`;
    const { data } = await axios.get(url, {
      params: { lat, lon },
      headers: { 'User-Agent': 'WeatherByWatz/1.0 github.com/DocwatZ/WeatherByWatz' },
      timeout: 8000,
    });
    const features = data.features || [];
    cache.set(cacheKey, features);
    res.json(features);
  } catch (err) {
    // Alerts are best-effort — return empty array on any error
    res.json([]);
  }
});

// GET /api/rainviewer
app.get('/api/rainviewer', async (req, res) => {
  const cacheKey = 'rainviewer_frames';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(RAINVIEWER_API, { timeout: 8000 });
    cache.set(cacheKey, data, 120); // shorter TTL for radar frames
    res.json(data);
  } catch (err) {
    console.error('RainViewer API error:', err.message);
    res.status(502).json({ error: 'Failed to fetch RainViewer data' });
  }
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`WeatherByWatz running on http://localhost:${PORT}`);
  console.log(`Cache TTL: ${CACHE_TTL}s | Default location: ${DEFAULT_LOCATION}`);
});

module.exports = app;
