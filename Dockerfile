FROM node:20-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json.
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
# If you have a package-lock.json, speed up installs with `npm ci`.
RUN npm install --omit=dev

# Copy local code to the container image.
COPY . .

# Service must listen to $PORT environment variable.
# Cloud Run sets this value at runtime.
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Run the web service on container startup.
CMD ["npm", "start"]

