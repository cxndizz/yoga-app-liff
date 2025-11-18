FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source files
COPY index.html vite.config.mjs ./
COPY src ./src

EXPOSE 3001

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]