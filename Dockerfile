# Multi-stage Dockerfile for DAGShield Node Client
# Optimized for production deployment with minimal attack surface

# Stage 1: Rust Build Environment
FROM rust:1.75-slim as rust-builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    cmake \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Rust project files
COPY node-client/Cargo.toml node-client/Cargo.lock ./
COPY node-client/src ./src/
COPY node-client/benches ./benches/

# Build optimized release binary
RUN cargo build --release --locked
RUN strip target/release/dagshield-node

# Stage 2: Python AI Models Build
FROM python:3.11-slim as python-builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements and install dependencies
COPY ai-models/requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy AI model files
COPY ai-models/ ./ai-models/

# Stage 3: Node.js Build Environment
FROM node:18-alpine as node-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY public/ ./public/
COPY styles/ ./styles/

# Build Next.js application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 4: Production Runtime
FROM ubuntu:22.04 as runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    jq \
    supervisor \
    nginx \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r dagshield && useradd -r -g dagshield -s /bin/bash dagshield

# Set working directory
WORKDIR /app

# Copy built binaries and applications
COPY --from=rust-builder /app/target/release/dagshield-node /usr/local/bin/
COPY --from=python-builder /root/.local /home/dagshield/.local
COPY --from=python-builder /app/ai-models /app/ai-models
COPY --from=node-builder /app/.next /app/.next
COPY --from=node-builder /app/public /app/public
COPY --from=node-builder /app/package*.json /app/
COPY --from=node-builder /app/node_modules /app/node_modules

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/healthcheck.sh /healthcheck.sh

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/config /var/log/supervisor \
    && chown -R dagshield:dagshield /app \
    && chmod +x /entrypoint.sh /healthcheck.sh /usr/local/bin/dagshield-node

# Copy default configuration
COPY config/production.toml /app/config/default.toml

# Set environment variables
ENV RUST_LOG=info
ENV DAGSHIELD_CONFIG_PATH=/app/config/default.toml
ENV DAGSHIELD_DATA_PATH=/app/data
ENV DAGSHIELD_LOG_PATH=/app/logs
ENV PATH="/home/dagshield/.local/bin:$PATH"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose ports
EXPOSE 3000 8080 9090 4001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /healthcheck.sh

# Switch to non-root user
USER dagshield

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# Metadata
LABEL org.opencontainers.image.title="DAGShield Node Client"
LABEL org.opencontainers.image.description="Decentralized AI-DePIN security network node"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="DAGShield Team"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/dagshield/dagshield"
