# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app

# Increase npm timeouts and retries to tolerate slower networks.
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:1.27-alpine AS serve
# The Angular build outputs the served assets under dist/document/browser/
# (the root of dist/document/ only holds 3rdpartylicenses.txt and
# prerendered-routes.json). Copy the contents of browser/ directly into
# nginx's web root so /remoteEntry.json and /index.html are at the top
# level, which is what the shell expects.
COPY --from=build /app/dist/document/browser/ /usr/share/nginx/html/
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]