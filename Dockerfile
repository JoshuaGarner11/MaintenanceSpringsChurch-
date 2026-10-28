# One image runs the web app, the scheduler and the one-off scripts (import, create-admin).
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx next build
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/data/uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed-art && npx next start -p 3000"]
