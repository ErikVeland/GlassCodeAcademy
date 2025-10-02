# Use Node.js 18 as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the backend code
COPY backend/ ./

# Expose the port the app runs on
EXPOSE 3002

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Command to run the application
CMD ["node", "server.js"]