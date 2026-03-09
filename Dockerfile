# Use the official lightweight Node.js 18 image.
FROM node:18-alpine

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy the local code to the container image
COPY . /usr/src/app/

# Install pnpm and a lightweight static server
RUN npm install -g pnpm serve

# Install dependencies.
RUN pnpm install 

# Move into the lib directory
WORKDIR /usr/src/app/lib

# Install dependencies.
RUN pnpm install

# Move back into the main directory
WORKDIR /usr/src/app

# Since you will build this in railway and not locally,
# we need to pass the .env variables at build time.
ARG VITE_PROD_BACKEND_URL

ENV VITE_PROD_BACKEND_URL=$VITE_PROD_BACKEND_URL

# Build the application.
RUN pnpm build

# Remove development dependencies.
RUN pnpm prune --prod

# Expose the desired port (e.g., 3000)
EXPOSE 3000

# Serve the built application with "serve" on port 3000.
CMD ["serve", "-s", "dist", "-l", "3000"]