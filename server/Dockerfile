# Use Red Hat UBI Node image to avoid Docker Hub rate limits
FROM registry.redhat.io/nodejs-24/nodejs-24:latest

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Run as OpenShift default user
USER 1001

# Start app
CMD ["npm", "start"]