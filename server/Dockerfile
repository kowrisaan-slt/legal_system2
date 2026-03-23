FROM node:24  # upgrade Node version to match Prisma

WORKDIR /app

# Copy package.json & install dependencies
COPY package*.json ./
RUN npm install

# Copy all code
COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Run app as non-root user (OpenShift default)
USER 1001

# Start server
CMD ["npm", "start"]