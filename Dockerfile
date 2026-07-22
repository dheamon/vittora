# Multi-stage build for a self-contained production image.
# Works with either SQLite (mount a volume for the .db file) or Postgres
# (just set DATABASE_URL and switch the provider in prisma/schema.prisma).

FROM node:20-slim AS base

# --- deps: install once, cached across builds ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- builder: compile the Next.js app ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runner: minimal runtime image ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN useradd --system --uid 1001 nextjs \
  # Pre-create /data owned by the app user so the named volume in
  # docker-compose.yml (empty on first run) inherits this ownership —
  # Docker seeds a fresh named volume from the image directory it mounts over.
  && mkdir -p /data && chown nextjs:nextjs /data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY docker-entrypoint.sh ./

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# Applies pending migrations, then starts the server. Safe to run on every
# boot — a no-op when the schema is already up to date.
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
