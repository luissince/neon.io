FROM nginx:1.25.3-alpine-slim

COPY config.conf /etc/nginx/conf.d/

COPY . /usr/share/nginx/html/

RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80