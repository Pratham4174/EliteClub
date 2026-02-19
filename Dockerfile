FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY playbox-frontend/package*.json ./
RUN npm ci
COPY playbox-frontend/ ./
ARG VITE_BACKEND_URL=/playbox
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm run build

FROM maven:3.9.9-eclipse-temurin-21 AS backend-builder
WORKDIR /backend
COPY playbox/pom.xml ./
COPY playbox/mvnw ./
COPY playbox/.mvn ./.mvn
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline
COPY playbox/src ./src
RUN ./mvnw -q -DskipTests package

FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gettext-base \
    nginx \
    mariadb-server \
    openjdk-21-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend-builder /backend/target/*.jar /app/app.jar
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html
COPY docker/start.sh /app/start.sh
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
RUN chmod +x /app/start.sh

ENV PORT=10000
EXPOSE 10000
CMD ["/app/start.sh"]
