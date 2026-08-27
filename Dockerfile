
# ── Base ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────
FROM base AS deps
# Skip Puppeteer's bundled Chromium download here — the runtime image
# installs Chromium via apt instead (see the `runner` stage below).
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────
FROM base AS builder
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm run build

# ── Runtime ──────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Puppeteer (certificate PDF/PNG generation) uses this apt-installed
# Chromium instead of downloading its own — see src/utils/certificate/generation.ts.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  chromium \
  fonts-liberation \
  ca-certificates \
  openssl \
  curl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate

# PYQ dataset (data/pyq/) — ~50MB of scraped question JSON, deliberately
# excluded from the build context (see .dockerignore) since it's large and
# churns independently of app code. Baked in at build time from the same
# public SeaweedFS bucket the re-hosted question images live in, instead of
# requiring a separately-provisioned Coolify volume synced by hand.
# To publish a refreshed dataset: re-run the tar+upload steps in
# data/pyq/README.md, then redeploy (rebuild) the app to pick it up.
ARG PYQ_DATA_URL=https://s3-xzopnmtqzetpcjcdqpv0s3j8.shubhamjha.live/pyq-images/data-archives/pyq-data-latest.tar.gz
RUN mkdir -p data/pyq \
  && curl -fsSL "$PYQ_DATA_URL" -o /tmp/pyq-data.tar.gz \
  && tar -xzf /tmp/pyq-data.tar.gz -C data/pyq \
  && rm /tmp/pyq-data.tar.gz

# Runs as root (simplest option here) — Coolify's /app/prisma volume mount
# (see README note below) otherwise needs its ownership fixed on every
# container start for a non-root user to write the SQLite file into it.
# Docker's container boundary is still the isolation layer either way.

# Next.js standalone output — see next.config.ts (output: "standalone").
# NOTE: we deliberately use the full `node_modules` from `builder` here
# instead of `.next/standalone`'s own trimmed copy. pnpm's node_modules is
# a tree of symlinks into a central `.pnpm` virtual store, so cherry-picking
# individual packages (e.g. just `prisma`, `@prisma/client`) risks copying
# a symlink without its resolved target and getting a broken module at
# runtime — copying the whole (self-consistent) tree avoids that entirely.
# It costs more image size than the fully-trimmed approach; correctness
# won over minimalism here since this couldn't be verified with a real
# `docker build` in this environment (no Docker daemon available).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone/server.js ./server.js
COPY --from=builder /app/.next/standalone/.next ./.next
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Applies pending Prisma migrations to the SQLite file (creating it on
# first run) before starting the server. See the README note below about
# mounting /app/prisma as a persistent volume in Coolify.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy; node server.js"]
