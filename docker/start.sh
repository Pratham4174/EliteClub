#!/usr/bin/env bash
set -euo pipefail

export PORT="${PORT:-10000}"
export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-prod}"

export MYSQL_DATA_DIR="${MYSQL_DATA_DIR:-/var/lib/mysql}"
export MYSQL_DATABASE="${MYSQL_DATABASE:-playbox}"
export MYSQL_USER="${MYSQL_USER:-playbox_user}"
export MYSQL_PASSWORD="${MYSQL_PASSWORD:-playbox_pass_123}"
export MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_pass_123}"

mkdir -p "${MYSQL_DATA_DIR}" /run/mysqld /var/log/mysql
chown -R mysql:mysql "${MYSQL_DATA_DIR}" /run/mysqld /var/log/mysql

if [ ! -d "${MYSQL_DATA_DIR}/mysql" ]; then
  mariadb-install-db --user=mysql --datadir="${MYSQL_DATA_DIR}"
fi

mariadbd \
  --user=mysql \
  --datadir="${MYSQL_DATA_DIR}" \
  --bind-address=127.0.0.1 \
  --port=3306 \
  --socket=/run/mysqld/mysqld.sock \
  --pid-file=/run/mysqld/mysqld.pid \
  --log-error=/var/log/mysql/error.log &
MYSQL_PID=$!

echo "Waiting for MariaDB..."
for i in $(seq 1 60); do
  if mariadb-admin ping --host=127.0.0.1 --port=3306 --silent; then
    break
  fi
  sleep 1
done

mariadb --protocol=socket --socket=/run/mysqld/mysqld.sock <<SQL
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
FLUSH PRIVILEGES;
SQL

export SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-jdbc:mysql://127.0.0.1:3306/${MYSQL_DATABASE}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}"
export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-${MYSQL_USER}}"
export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-${MYSQL_PASSWORD}}"
export SPRING_DATASOURCE_DRIVER_CLASS_NAME="${SPRING_DATASOURCE_DRIVER_CLASS_NAME:-com.mysql.cj.jdbc.Driver}"
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

java -jar /app/app.jar --server.port=8080 &
APP_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

trap 'kill -TERM ${APP_PID} ${MYSQL_PID} ${NGINX_PID} 2>/dev/null || true' SIGTERM SIGINT
wait -n "${APP_PID}" "${MYSQL_PID}" "${NGINX_PID}"
exit $?
