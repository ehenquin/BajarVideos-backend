FROM node:18

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl && \
    pip3 install --break-system-packages yt-dlp

# 🔥 IMPORTANTE: instalar nodejs runtime para yt-dlp
RUN apt-get install -y nodejs npm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
