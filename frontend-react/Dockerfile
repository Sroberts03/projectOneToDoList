# Development Dockerfile for React app
FROM node:20

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code (for dev, this can be replaced by a bind mount)
COPY . .

# Expose React dev server port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]