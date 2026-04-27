FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
# Note: Next.js build requires environment variables if they are used at build time.
# But for Prisma and standard Next.js, it usually builds fine.
RUN npm run build

# Expose the port
EXPOSE 3000

# Script to run migrations, seed the database, and start the app
CMD npx prisma migrate deploy && npm run seed && npm start
