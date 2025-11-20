FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openslide-tools \
    python3 \
    python3-pip \
    python3-openslide \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first
COPY package.json ./

# Install Node dependencies
RUN npm install --omit=dev

# Copy application code
COPY server.js ./
COPY convert.py ./

# Make convert.py executable
RUN chmod +x convert.py

# Create necessary directories
RUN mkdir -p uploads public/slides

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "server.js"]
