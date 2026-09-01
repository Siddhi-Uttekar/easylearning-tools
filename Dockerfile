# syntax=docker/dockerfile:1

# ── Base ─────────────────────────────────────────────────────────────
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────
FROM base AS deps
# Coolify injects its "Available at Buildtime" env vars (including
# NODE_ENV=production) as ARG/ENV right after each FROM line, which makes
# `pnpm install` skip devDependencies (typescript, tailwindcss, @types/*,
# eslint*) — but next.config.ts requires typescript just to load, and
# `next build` needs the rest. Re-override it here, after Coolify's
# injection point, so it's the last word before install actually runs.
ENV NODE_ENV=development
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
# `next build` itself needs NODE_ENV=production — this is the opposite of
# the `deps` stage above. Building with it unset/development trips a real
# Next.js bug where the auto-generated /404 and /500 fallback pages fail
# with "Error: <Html> should not be imported outside of pages/_document",
# even in a bare app-router project with zero next/document usage
# (reproduced locally down to a stock layout.tsx + page.tsx; see
# https://github.com/vercel/next.js/discussions/77262 for the same report
# from many other projects). devDependencies are already installed at
# this point from the `deps` stage, so this doesn't reintroduce that issue.
RUN NODE_ENV=production pnpm run build

# ── Runtime ──────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Docker auto-injects HOSTNAME=<container-id> into every container, and the
# Next.js standalone server (server.js: `process.env.HOSTNAME || '0.0.0.0'`)
# binds to whatever HOSTNAME resolves to instead of falling back to 0.0.0.0
# — so it ends up listening on an address Coolify's reverse proxy can't
# reach, even though the process itself starts fine ("Ready in ...ms" in
# the logs). Force it back to all-interfaces explicitly.
ENV HOSTNAME=0.0.0.0
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

# Runs as root (simplest option here). Prisma now points at Postgres
# (NEW_PLAIN_DB) rather than a local SQLite file, so there's no persistent
# volume or local-write-permission concern driving this either way anymore.

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

# Applies any pending Prisma migrations against Postgres (idempotent — a
# no-op once already applied) before starting the server.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy; node server.js"]
