FROM node:24-alpine AS deps

WORKDIR /srv/app

COPY package.json package-lock.json ./
RUN npm ci && sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.package-lock.sha256

FROM deps AS dev

COPY . .

EXPOSE 5173

CMD ["sh", "scripts/docker-dev.sh"]

FROM deps AS build

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS serve

COPY --from=build /srv/app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  location / {\n    try_files $uri /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
