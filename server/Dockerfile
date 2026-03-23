FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Expose port for OpenShift
EXPOSE 5000

# Generate Prisma client at runtime (so DATABASE_URL is available) and start server
CMD ["sh", "-c", "npx prisma generate && npm start"]