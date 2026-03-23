# Use Red Hat NodeJS 24 image
FROM registry.redhat.io/nodejs-24/nodejs-24:latest

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

# Make node_modules writable for OpenShift default non-root user
RUN chown -R 1001:0 node_modules

# Switch to non-root OpenShift user
USER 1001

# Expose app port
EXPOSE 5000

# Default command
CMD ["npm", "start"]