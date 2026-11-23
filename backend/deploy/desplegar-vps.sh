#!/bin/bash
# Despliegue de AULIX en el VPS (puerto 8106).
# Uso (desde tu PC, en la raiz del proyecto):
#   ./deploy/desplegar-vps.sh TU_VPS_O_IP
# Ejemplo: ./deploy/desplegar-vps.sh ubuntu@159.173.138.239
# Requisitos en el VPS: Java 21, MySQL con la BD aulix_db creada
# (ver deploy/crear-bd.sql) y el archivo /opt/aulix/.env ya creado
# a partir de deploy/.env.example (con DB_PASS y JWT_SECRET reales).
set -e
VPS="${1:?Uso: $0 <usuario@ip-o-dominio-del-vps>}"
echo "== 1. Compilando el .jar =="
./mvnw -q clean package -DskipTests
echo "== 2. Subiendo el .jar al VPS (/opt/aulix) =="
ssh "$VPS" "sudo mkdir -p /opt/aulix/uploads && sudo chown \$USER /opt/aulix /opt/aulix/uploads"
scp target/aulix-0.0.1-SNAPSHOT.jar "$VPS:/opt/aulix/"
scp deploy/aulix.service "$VPS:/tmp/aulix.service"
echo "== 3. Instalando el servicio systemd =="
ssh "$VPS" "sudo cp /tmp/aulix.service /etc/systemd/system/aulix.service && sudo systemctl daemon-reload && sudo systemctl enable aulix && sudo systemctl restart aulix"
echo "== 4. Estado (sin token debe dar 401, eso confirma que protege) =="
ssh "$VPS" "sleep 5; sudo systemctl status aulix --no-pager | head -15; echo '--- prueba sin token (esperado: 401) ---'; curl -s -w '\nHTTP %{http_code}\n' http://localhost:8106/api/clases"
echo "Listo. Prueba desde fuera con Bruno (environment vps): http://TU_VPS:8106/api/auth/login"
echo "Cuentas sembradas: laura@colegio.edu / Docente123*  y  ana.sofia@colegio.edu / Estudiante123*"
