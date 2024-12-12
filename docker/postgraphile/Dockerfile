FROM guergeiro/pnpm:20-9-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Start postgraphile in development mode
CMD ["pnpm", "exec", "tsx", "docker/postgraphile/dev.ts"]