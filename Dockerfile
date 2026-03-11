### Multi-stage Dockerfile for mono-container (frontend + backend)

FROM node:20-alpine AS frontend-build
WORKDIR /app

# Install frontend deps and build
COPY frontend-app/package*.json ./frontend-app/
WORKDIR /app/frontend-app
RUN npm install

# Build React app; API will be same-origin /api
ENV REACT_APP_API_URL=/api
RUN npm run build

FROM node:20-alpine AS backend
WORKDIR /app

# Install backend deps
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --only=production

# Copy backend source
COPY backend ./ 

# Copy built frontend into backend/public so Express can serve it
COPY --from=frontend-build /app/frontend-app/build ./public

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]

