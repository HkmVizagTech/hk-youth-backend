FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies and prisma CLI
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Generate prisma client targeting the linux environment
RUN npx prisma generate

# Copy application files
COPY . .

# Run the app 
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start"]
