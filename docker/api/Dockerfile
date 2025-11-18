FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000

# Use the entrypoint script
CMD ["./docker-entrypoint.sh"]