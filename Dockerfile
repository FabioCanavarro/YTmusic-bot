FROM node:20-slim

# Install native ffmpeg (crucial for Opus audio) and python3 (crucial for yt-dlp fallback extraction)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions first
COPY package*.json ./

# Install all node modules cleanly in the Linux container
RUN npm install

# Copy the rest of your local project files into the container
COPY . .

# Compile your TypeScript code into the dist/ folder
RUN npm run build

# Boot the bot
CMD ["npm", "start"]
