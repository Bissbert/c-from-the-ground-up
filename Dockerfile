FROM node:22-alpine
WORKDIR /course
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
COPY app ./app
ENV HOST=0.0.0.0 PORT=5173
EXPOSE 5173
CMD ["node", "server.mjs"]
