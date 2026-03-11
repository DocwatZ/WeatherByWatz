```
 ██╗    ██╗███████╗ █████╗ ████████╗██╗  ██╗███████╗██████╗ ██████╗ ██╗   ██╗██╗    ██╗ █████╗ ████████╗███████╗
 ██║    ██║██╔════╝██╔══██╗╚══██╔══╝██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝██║    ██║██╔══██╗╚══██╔══╝╚══███╔╝
 ██║ █╗ ██║█████╗  ███████║   ██║   ███████║█████╗  ██████╔╝██████╔╝ ╚████╔╝ ██║ █╗ ██║███████║   ██║     ███╔╝
 ██║███╗██║██╔══╝  ██╔══██║   ██║   ██╔══██║██╔══╝  ██╔══██╗██╔══██╗  ╚██╔╝  ██║███╗██║██╔══██║   ██║    ███╔╝
 ╚███╔███╔╝███████╗██║  ██║   ██║   ██║  ██║███████╗██║  ██║██████╔╝   ██║   ╚███╔███╔╝██║  ██║   ██║   ███████╗
  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
                              📡  G L O B A L   W E A T H E R   C O M M A N D   C E N T R E  📡
```

<div align="center">

![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-00ff41?style=for-the-badge)
![Open-Meteo](https://img.shields.io/badge/Powered%20by-Open--Meteo-00e5ff?style=for-the-badge)
![RainViewer](https://img.shields.io/badge/Radar-RainViewer-ffb300?style=for-the-badge)

**A retro 1990s-style global weather command centre — real data, stunning visuals, zero API keys required.**

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌍 **3D Interactive Globe** | Clickable globe powered by Globe.gl with 20 major city weather markers and auto-rotation |
| 📡 **Animated Radar** | Live RainViewer radar tiles with play/pause controls — radar, satellite & infrared modes |
| 🌡 **Real-Time Conditions** | Temperature, feels-like, humidity, wind speed/direction, pressure, UV index, cloud cover, precipitation |
| 📅 **10-Day Forecast** | Hourly (24hr) and daily 10-day forecasts with WMO weather code icons |
| 📊 **Live Charts** | 24-hour temperature trend (line) and precipitation probability (bar) via Chart.js |
| ⚠️ **Weather Alerts** | Live scrolling ticker with MET Norway severe weather alerts |
| 🖥 **CRT Mode** | Toggle retro CRT scanline effect for maximum nostalgia |
| 🌡 **°C / °F Toggle** | Switch between Celsius and Fahrenheit instantly across all displays |
| 📍 **Geolocation** | Auto-detects your location, falls back to configurable default |
| 🔄 **Auto-Refresh** | Weather data refreshes every 10 minutes automatically |
| 🗄 **Server Caching** | Node-Cache with configurable TTL keeps API calls lean |
| 🐳 **Docker Ready** | Single-command deploy, Unraid template included |
| 📱 **Responsive** | Mobile-first CSS grid layout works on all screen sizes |
| 🔒 **Secure** | Helmet.js security headers, input validation, no API keys needed |

---

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
git clone https://github.com/DocwatZ/WeatherByWatz.git
cd WeatherByWatz
docker compose up -d
```

Then open **http://localhost:3000** in your browser.

### Docker Run

```bash
docker run -d \
  --name WeatherByWatz \
  -p 3000:3000 \
  -e DEFAULT_LOCATION="51.5074,-0.1278" \
  --restart unless-stopped \
  weatherbywatz/weatherbywatz:latest
```

### Node.js (Local Development)

```bash
git clone https://github.com/DocwatZ/WeatherByWatz.git
cd WeatherByWatz
npm install
cp .env.example .env
# Edit .env as needed
npm start
```

For hot-reload during development:

```bash
npm install -g nodemon
npm run dev
```

---

## 🏠 Unraid Installation

1. In Unraid, go to **Community Applications**
2. Search for **WeatherByWatz**
3. Click **Install**
4. Configure your default location (lat,lon) and port
5. Click **Apply**

Or manually add the template URL in the Docker tab:
```
https://raw.githubusercontent.com/DocwatZ/WeatherByWatz/main/unraid-template.xml
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port the server listens on |
| `CACHE_INTERVAL` | `600` | Weather data cache TTL in seconds (10 minutes) |
| `DEFAULT_LOCATION` | `51.5074,-0.1278` | Fallback location as `lat,lon` (London, UK) |
| `OPEN_METEO_ENDPOINT` | `https://api.open-meteo.com/v1` | Open-Meteo API base URL (change for self-hosted) |
| `RAINVIEWER_API` | `https://api.rainviewer.com/public/weather-maps.json` | RainViewer frames API endpoint |
| `SATELLITE_SOURCE` | `GOES-EAST` | Preferred satellite source (GOES-EAST, GOES-WEST, HIMAWARI, METEOSAT) |
| `SHIP_TRACKING_SOURCE` | *(empty)* | Optional AIS ship tracking API URL |

Copy `.env.example` to `.env` and customise for local development:

```bash
cp .env.example .env
```

---

## 🏗 Architecture

```
WeatherByWatz/
├── server.js                 # Express server — API proxy, caching, security
├── package.json              # Dependencies
├── Dockerfile                # Production Docker image (node:20-alpine)
├── docker-compose.yml        # Compose stack with Traefik labels
├── unraid-template.xml       # Unraid Community Applications template
├── .env.example              # Environment variable reference
├── .gitignore
└── public/
    ├── index.html            # Single-page app shell
    ├── css/
    │   └── style.css         # Retro terminal CSS (custom properties, animations)
    └── js/
        ├── weather.js        # WeatherData module — API calls, WMO codes, unit conversion
        ├── globe.js          # GlobeModule — Globe.gl 3D globe with city markers
        ├── radar.js          # RadarModule — Leaflet map + RainViewer animated radar
        ├── ticker.js         # TickerModule — Scrolling alerts/status ticker
        └── app.js            # App — main orchestrator, charts, UI wiring
```

### Data Flow

```
Browser → GET /api/weather?lat=&lon=
            ↓ NodeCache (TTL: CACHE_INTERVAL)
            ↓ Open-Meteo API
            ← JSON response

Browser → GET /api/forecast?lat=&lon=
Browser → GET /api/alerts?lat=&lon=   (MET Norway — empty array on error)
Browser → GET /api/rainviewer         (RainViewer — radar tile manifests)
```

### Frontend Modules

| Module | Role |
|--------|------|
| `WeatherData` | Fetches all API data, exposes WMO code map, unit conversion |
| `GlobeModule` | Manages Globe.gl instance, city point clicks, auto-rotation |
| `RadarModule` | Manages Leaflet map, RainViewer tile animation, layer switching |
| `TickerModule` | Manages scrolling alert ticker text |
| `App` | Orchestrates all modules, Chart.js charts, clock, CRT mode, unit toggle |

---

## 🌐 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/config` | Returns sanitised server config (default location, satellite source, cache TTL, version) |
| `GET /api/weather?lat=&lon=` | Current weather from Open-Meteo (temperature, wind, pressure, UV, etc.) |
| `GET /api/forecast?lat=&lon=` | Hourly (24h) + daily (10-day) forecast from Open-Meteo |
| `GET /api/alerts?lat=&lon=` | Severe weather alerts from MET Norway (returns `[]` if unavailable) |
| `GET /api/rainviewer` | RainViewer radar/satellite frame manifest |

All `/api/` endpoints validate `lat` (−90 to 90) and `lon` (−180 to 180) inputs and return HTTP 400 on invalid input.

---

## 🔌 Third-Party Services

WeatherByWatz requires **zero API keys** — all services are free and open:

| Service | Usage | Rate Limits |
|---------|-------|-------------|
| [Open-Meteo](https://open-meteo.com/) | Weather & forecast data | 10,000 calls/day free |
| [RainViewer](https://www.rainviewer.com/api.html) | Radar & satellite tiles | Free public API |
| [MET Norway](https://api.met.no/) | Severe weather alerts | Fair use |
| [Globe.gl](https://globe.gl/) | 3D globe rendering | Client-side (CDN) |
| [Leaflet](https://leafletjs.com/) | 2D map/radar display | Client-side (CDN) |
| [Chart.js](https://www.chartjs.org/) | Temperature/precip charts | Client-side (CDN) |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Ideas for Contributions

- 🌊 Marine weather overlay
- ✈️ Aviation METAR/TAF display
- 🚢 AIS ship tracking layer
- 🌡 Historical weather charts
- 🔔 Browser push notifications for alerts
- 🗺 Additional map tile providers
- 🌍 Additional city markers

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

```
Copyright (c) 2024 DocwatZ

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
```

---

<div align="center">

**Built with 💚 by DocwatZ**

*WeatherByWatz — Where 1990s aesthetics meet modern weather data*

📡 `GLOBAL WEATHER COMMAND CENTRE` 📡

</div>
