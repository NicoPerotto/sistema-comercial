-- ============================================================
-- Registrar las migraciones como YA APLICADAS en Supabase.
-- Esto evita que `prisma migrate deploy` (que corre Vercel en build)
-- intente recrear tablas que ya existen y falle.
-- Pegar y ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1) Crear la tabla de control de migraciones si no existe
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY,
    "checksum"              TEXT NOT NULL,
    "finished_at"          TIMESTAMP WITH TIME ZONE,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"       TIMESTAMP WITH TIME ZONE,
    "started_at"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"  INTEGER NOT NULL DEFAULT 0
);

-- 2) Insertar las dos migraciones como aplicadas (id y checksum pueden ser valores fijos;
--    Prisma solo chequea que existan con esos nombres para no re-ejecutarlas)
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES
  (gen_random_uuid(), '0001_init_registered', NOW(), '0001_init', 1),
  (gen_random_uuid(), '0002_add_role_model_registered', NOW(), '0002_add_role_model', 1),
  (gen_random_uuid(), '0003_add_system_config_registered', NOW(), '0003_add_system_config', 1)
ON CONFLICT ("id") DO NOTHING;

-- ¡Listo! Vercel podrá correr `migrate deploy` sin tocar las tablas existentes.
