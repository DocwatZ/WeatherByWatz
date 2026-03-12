// WeatherByWatz - Ticker Module
const TickerModule = (() => {
  const DEFAULT_MESSAGES = [
    '⚠ WEATHERBY GLOBAL WEATHER COMMAND CENTRE ONLINE',
    '🌍 MONITORING GLOBAL WEATHER SYSTEMS 24/7',
    '📡 CONNECTED TO OPEN-METEO GLOBAL WEATHER GRID',
    '🌪 SEVERE WEATHER TRACKING ACTIVE',
    '⚡ LIGHTNING DETECTION NETWORK ONLINE',
    '🛰 SATELLITE IMAGERY FEEDS ACTIVE',
    '🌊 MARINE WEATHER MONITORING ACTIVE',
    '✈ AVIATION METAR DATA STREAMING',
    '🌡 TEMPERATURE MONITORING: ALL STATIONS NOMINAL',
    '🌬 WIND MONITORING: ALL ANEMOMETERS ONLINE',
    '💧 PRECIPITATION TRACKING: ALL GAUGES ACTIVE',
  ];

  let messages = [...DEFAULT_MESSAGES];
  let el;

  function init(elementId) {
    el = document.getElementById(elementId);
    if (!el) return;
    update(messages);
  }

  function update(newMessages) {
    if (newMessages && newMessages.length > 0) {
      messages = newMessages;
    }
    if (el) {
      el.textContent = messages.join('    ///    ');
    }
  }

  function addAlert(text) {
    messages.unshift('🔴 ALERT: ' + text.toUpperCase());
    update(messages);
  }

  function setWeatherSummary(location, temp, desc) {
    const summary = `📍 ${location}: ${temp} — ${desc}`;
    const existing = messages.findIndex(m => m.startsWith('📍'));
    if (existing >= 0) messages[existing] = summary;
    else messages.push(summary);
    update(messages);
  }

  return { init, update, addAlert, setWeatherSummary };
})();
