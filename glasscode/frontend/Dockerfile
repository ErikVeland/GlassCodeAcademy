# Dockerfile for Next.js Frontend
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Copy standalone output
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_API_BASE=https://fullstack-academy-backend.onrender.com
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]