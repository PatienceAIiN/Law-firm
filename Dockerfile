# syntax=docker/dockerfile:1.6

# ---- base ---- (shared across stages so alpine is pulled only once)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy prisma schema first (cached if unchanged)
COPY prisma ./prisma
RUN npx prisma generate

# Now copy everything else
COPY . .

# Pass DATABASE_URL from Render environment to the build process
# so Prisma can initialize during Next.js static prerendering
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Push schema to database so tables exist for Next.js static prerendering
RUN npx prisma db push --accept-data-loss
RUN npm run build

# ---- runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
# Do NOT set ENV PORT=3000 here, let Render inject its own PORT at runtime

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone server + static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma client + schema for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

# Run pending migrations against DATABASE_URL, then launch the server.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null; node server.js"]
