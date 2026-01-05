# Use slim Alpine-based Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies (npm ci will reuse package-lock)
COPY package*.json ./
RUN npm ci --silent

# Copy app source
COPY . .

# Expose application port
EXPOSE 5000

# Start in dev mode with nodemon for hot reload inside container
CMD ["npm", "run", "dev"]
