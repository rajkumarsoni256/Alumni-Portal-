# Use Node.js 20 Alpine lightweight base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose backend application port
EXPOSE 8080

# Production startup command
CMD ["npm", "start"]
