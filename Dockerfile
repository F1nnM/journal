# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx nuxt build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/.output .output

ENV NUXT_HOST=0.0.0.0
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
