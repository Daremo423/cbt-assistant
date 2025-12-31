# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --no-audit

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Stage 2: Serve the application with the Node.js backend
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --only=production --no-audit

# Copy built frontend from the previous stage
COPY --from=build /app/build ./build

# Copy server code
COPY server ./server
# Copy source code (might be needed if server imports from src, though usually server code should be self-contained or built)
# Based on current structure, server imports are local to server/ or node_modules. 
# However, if there are shared utils in src, we might need them. 
# Let's check imports in server/auth.js and server/index.js.
# They only import from 'jsonwebtoken', 'bcryptjs', './config', './auth'. 
# So copying 'server' folder is sufficient.

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]