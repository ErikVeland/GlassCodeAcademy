# Use Nginx base image for serving static files
FROM nginx:alpine

# Copy static files to Nginx serving directory
COPY . /usr/share/nginx/html

# Expose port
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]