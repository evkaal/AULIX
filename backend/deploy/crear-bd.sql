-- Crear la base de datos de AULIX en el VPS (o en local).
-- Ejecutar en MySQL como root o con un usuario con permisos:
--   mysql -u root -p < deploy/crear-bd.sql
-- Las tablas las crea Hibernate (ddl-auto=update) y los datos los
-- siembra DatabaseSeeder al primer arranque (solo si usuarios esta vacia).
CREATE DATABASE IF NOT EXISTS aulix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
