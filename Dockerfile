## Multi‑stage Dockerfile for Genesys RPG web app

### Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production=false
COPY . ./
RUN npm run prisma:generate
RUN npm run build

### Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# copy dependency tree
COPY package.json package-lock.json ./
RUN npm install --production

# copy built application and prisma client
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/next.config.js ./
COPY --from=build /app/next-env.d.ts ./
COPY --from=build /app/tsconfig.json ./

EXPOSE 3000

CMD ["npm", "start"]