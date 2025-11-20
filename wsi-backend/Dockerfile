FROM node:18-bullseye

# Install OpenSlide and Python for conversion
RUN apt-get update && apt-get install -y \
    openslide-tools \
    python3 \
    python3-pip \
    python3-openslide \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app files
COPY . .

# Create directories for uploads and converted files
RUN mkdir -p /app/uploads /app/public/slides

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
