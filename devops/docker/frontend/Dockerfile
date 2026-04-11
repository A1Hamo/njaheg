# ── Stage 1: build React ──
FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
COPY package*.json ./
RUN npm install && npm cache clean --force
COPY . .
RUN npm run build

# ── Stage 2: serve with Nginx ──
FROM nginx:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost/ || exit 1
CMD ["nginx","-g","daemon off;"]
