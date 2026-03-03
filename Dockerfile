FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
ENV FRONTEND_DIST_DIR=/app/client/dist

WORKDIR /app

COPY server/dist /app/server/dist
COPY server/.env.example /app/server/.env.example
COPY client/dist /app/client/dist

VOLUME ["/data"]

EXPOSE 3000

WORKDIR /app/server

CMD ["node", "dist/index.js"]
