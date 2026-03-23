# server/Dockerfile
FROM registry.redhat.io/nodejs-24/nodejs-24:24-ubi9

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

# Make node_modules writable for OpenShift non-root user
RUN chown -R 1001:0 node_modules

USER 1001

EXPOSE 5000

CMD ["npm", "start"]