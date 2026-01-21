# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files first for better layer caching
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci --silent

# Copy frontend source
COPY frontend/ ./

# Set the API URL for production build
ENV REACT_APP_API_URL=/api

# Build the frontend
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM eclipse-temurin:17-jdk-alpine AS backend-build

WORKDIR /app

# Install Maven dependencies first for better layer caching
COPY pom.xml ./
COPY mvnw ./
COPY .mvn .mvn

# Make Maven wrapper executable
RUN chmod +x mvnw

# Download dependencies (this layer gets cached)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Copy frontend build to static resources so Spring Boot serves it
COPY --from=frontend-build /app/frontend/build ./src/main/resources/static

# Build the application (skip tests for faster build)
RUN ./mvnw package -DskipTests -B

# ============================================
# Stage 3: Runtime
# ============================================
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Create data directory for H2 database
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Copy the built JAR from backend-build stage
COPY --from=backend-build /app/target/*.jar app.jar

# Change ownership of the JAR file
RUN chown appuser:appgroup app.jar

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Set JVM options for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Run the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]