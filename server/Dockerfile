FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

# Ensure proper permissions for OpenShift non-root user
RUN chown -R 1001:0 /app

# Switch to non-root OpenShift user
USER 1001

# Expose port
EXPOSE 5000

# Start app
CMD ["npm", "start"]