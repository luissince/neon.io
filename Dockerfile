# Usa una imagen base de Nginx
FROM nginx:alpine

# Copia los archivos del juego al directorio de contenido estático de Nginx
COPY . /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Comando por defecto para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
