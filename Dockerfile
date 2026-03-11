FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
ENV NODE_ENV=production \
    PORT=3000 \
    CACHE_INTERVAL=600 \
    DEFAULT_LOCATION="51.5074,-0.1278" \
    OPEN_METEO_ENDPOINT="https://api.open-meteo.com/v1" \
    RAINVIEWER_API="https://api.rainviewer.com/public/weather-maps.json" \
    SATELLITE_SOURCE="GOES-EAST"
USER node
CMD ["node", "server.js"]
