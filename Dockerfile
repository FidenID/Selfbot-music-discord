FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg python3 python3-pip ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN mkdir -p data tmp

ENV YTDLP_PATH=/usr/local/bin/yt-dlp
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
