FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Copy entrypoint script with absolute path
COPY docker-entrypoint.sh /app/entrypoint.sh

# Make entrypoint executable and ensure correct line endings
RUN chmod +x /app/entrypoint.sh && \
    sed -i 's/\r$//' /app/entrypoint.sh

EXPOSE 4000

# Use the entrypoint script
CMD ["/app/entrypoint.sh"]