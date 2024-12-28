# Dockerfile
# Imagen base para compilar el proyecto
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Imagen final para producción
FROM node:18-alpine AS production 

WORKDIR /app

COPY --from=build /app/dist ./dist

# Instalar serve globalmente
RUN npm install -g serve

# El usuario node ya viene en la imagen de node:alpine
USER node

# serve usa el puerto 80 por defecto
EXPOSE 80

# Servir los archivos estáticos
CMD ["serve", "-s", "dist", "-l", "80"]