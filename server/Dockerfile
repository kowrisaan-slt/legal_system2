FROM node:18

WORKDIR /app

# Install dependencies and generate Prisma client
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]