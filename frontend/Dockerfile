FROM node:18-alpine

WORKDIR /app

# Copy package management files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
