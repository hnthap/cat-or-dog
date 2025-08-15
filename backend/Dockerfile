FROM node:24.5.0-alpine3.22
WORKDIR /app
RUN apk add --no-cache vips-dev gcc g++ make python3
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "server.js"]
