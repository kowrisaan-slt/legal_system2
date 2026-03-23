FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Make prisma folder writable for non-root users
RUN mkdir -p node_modules/prisma && chmod -R 777 node_modules/prisma

# Expose port for OpenShift
EXPOSE 5000

# Generate Prisma client at runtime, then start server
CMD ["sh", "-c", "npx prisma generate && npm start"]