FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/*.html /usr/share/nginx/html/
COPY --from=build /app/src/css /usr/share/nginx/html/src/css
COPY --from=build /app/dist/js /usr/share/nginx/html/dist/js

EXPOSE 80
