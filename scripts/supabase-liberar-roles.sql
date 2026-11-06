-- Liberar edición de Owner y Encargado (solo ADMIN queda protegido).
-- No borra nada: solo cambia el flag isSystem en los roles base.
-- Pegar y ejecutar en Supabase > SQL Editor.

UPDATE "Role"
SET "isSystem" = false
WHERE "slug" IN ('OWNER', 'MANAGER');

-- Verificación (opcional): debería mostrar isSystem=false para OWNER y MANAGER, true para ADMIN
SELECT "slug", "name", "isSystem" FROM "Role" ORDER BY "slug";
