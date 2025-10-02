# Use Node.js base image
FROM node:18-alpine

# Install http-server globally
RUN npm install -g http-server

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Set working directory to public folder
WORKDIR /app/public

# Expose port
EXPOSE 3000

# Start the application
CMD ["http-server", ".", "-p", "3000"]