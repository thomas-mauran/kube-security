# Step 1: Use the official Nginx image from the Docker Hub
FROM nginx:alpine

# Step 2: Copy the local HTML files into the container's nginx server
COPY ./index.html /usr/share/nginx/html/index.html

# Step 3: Expose port 80 so that the container is accessible
EXPOSE 80

# Step 4: No need to define CMD as the default command for nginx is already set
# Nginx will serve the static files on port 80 by default
