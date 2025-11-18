FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Copy database migrations
COPY ../../docker/db/migrations /docker/db/migrations

# Copy entrypoint script with absolute path
COPY docker-entrypoint.sh /app/entrypoint.sh

# Make entrypoint executable and ensure correct line endings
RUN chmod +x /app/entrypoint.sh && \
    sed -i 's/\r$//' /app/entrypoint.sh

EXPOSE 4000

CMD ["/app/entrypoint.sh"]
