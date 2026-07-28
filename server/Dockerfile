FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# Runs via tsx directly (not a tsc build + plain `node`) for the same reason
# the local "dev"/"start" scripts do: this project's ESM/bundler-style
# imports need tsx/esbuild's resolution, not NodeNext's stricter rules.
# Cloud Run injects env vars directly (no .env file in the image), so this
# is `tsx src/index.ts`, not the --env-file=.env variant npm scripts use
# locally.
CMD ["npx", "tsx", "src/index.ts"]
