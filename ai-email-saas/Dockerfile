FROM node:20-alpine

# Install Python and required system packages
RUN apk add --no-cache python3 py3-pip make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install Node.js dependencies
RUN npm ci --only=production

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm ci && npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "src/server.js"]
