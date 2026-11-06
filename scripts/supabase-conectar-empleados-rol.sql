-- Conectar empleados a la tabla Role (Vercel).
-- Crea los roles operativos VENDEDOR y CAJERO y asigna roleId a los empleados
-- existentes segun su campo role (String). NO borra nada.
-- Pegar y ejecutar en Supabase > SQL Editor.

-- 1) Roles operativos (Owner/Admin/Encargado ya existen)
INSERT INTO "Role" ("id", "name", "slug", "description", "isSystem", "permissions", "createdAt", "updatedAt") VALUES
  ('role_vendedor', 'Vendedor', 'VENDEDOR', 'Personal de ventas en mostrador.', true,
   '{"windows":["/","/ventas/nueva","/productos"]}', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "permissions" = EXCLUDED."permissions";

INSERT INTO "Role" ("id", "name", "slug", "description", "isSystem", "permissions", "createdAt", "updatedAt") VALUES
  ('role_cajero', 'Cajero', 'CAJERO', 'Manejo de caja diaria.', true,
   '{"windows":["/","/caja","/ventas/nueva","/productos"]}', NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "permissions" = EXCLUDED."permissions";

-- 2) Migrar empleados existentes a roleId (solo los que no lo tienen)
UPDATE "User" SET "roleId" = 'role_owner'    WHERE "role" = 'ADMIN'     AND "roleId" IS NULL;
UPDATE "User" SET "roleId" = 'role_manager'  WHERE "role" = 'MANAGER'   AND "roleId" IS NULL;
UPDATE "User" SET "roleId" = 'role_vendedor' WHERE "role" = 'SELLER'    AND "roleId" IS NULL;
UPDATE "User" SET "roleId" = 'role_cajero'   WHERE "role" = 'CAJERO'    AND "roleId" IS NULL;
-- PREVENTISTA no accede al sistema: se deja sin roleId (no aparece en el sidebar).

-- 3) Verificacion (opcional)
SELECT u."username", u."role", u."roleId", r."name" AS rol_asignado
FROM "User" u LEFT JOIN "Role" r ON r."id" = u."roleId"
ORDER BY u."role";
