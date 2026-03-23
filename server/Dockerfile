FROM node:18

WORKDIR /app

# Copy package.json first to leverage caching
COPY package*.json ./
RUN npm install

# Copy the app
COPY . .

# Make prisma folder writable for OpenShift random UID
RUN mkdir -p node_modules/prisma && chown -R 1001:0 node_modules/prisma

# Use non-root user
USER 1001

# Expose port
EXPOSE 5000

# Generate Prisma client at runtime and start server
CMD ["sh", "-c", "npx prisma generate && npm start"]