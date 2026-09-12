#!/bin/sh
# Recarga nginx cuando el backend actualiza slug-redirects.conf (301 automáticos).
CONF="/etc/nginx/argo-redirects/slug-redirects.conf"
(
  while true; do
    if [ -f "$CONF" ]; then
      inotifywait -e modify,create,close_write,move,attrib "$CONF" 2>/dev/null || sleep 10
    else
      sleep 5
    fi
    nginx -s reload 2>/dev/null || true
  done
) &
