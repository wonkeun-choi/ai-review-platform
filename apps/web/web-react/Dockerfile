# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build   # Vite면 dist, CRA면 build가 나옴

# --- serve ---
FROM nginx:alpine
# SPA 라우팅용 설정(아래 default.conf 파일과 함께)
COPY default.conf /etc/nginx/conf.d/default.conf
# Vite는 dist, CRA는 build 경로로 바꿔줘
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
