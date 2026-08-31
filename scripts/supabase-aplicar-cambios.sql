-- ============================================================
--  SCRIPT FINAL PARA SUPABASE (SQL Editor)
--  Aplica todos los cambios hechos localmente al entorno de producción.
--  Pegar y ejecutar en: Supabase > SQL Editor > New query.
--  Es idempotente (se puede correr varias veces sin romper).
-- ============================================================

-- 1) Nueva columna en Role: showInEmployees (para la ventana Vendedores)
ALTER TABLE "Role" ADD COLUMN IF NOT EXISTS "showInEmployees" BOOLEAN NOT NULL DEFAULT false;

-- 2) Roles operativos VENDEDOR y CAJERO (editables, isSystem=false)
INSERT INTO "Role" ("id", "name", "slug", "description", "isSystem", "showInEmployees", "permissions", "createdAt", "updatedAt")
VALUES
  ('rol-vendedor', 'Vendedor', 'VENDEDOR', 'Personal de ventas en mostrador.', false, true,
   '{"windows":["/","/ventas/nueva","/productos"]}', now(), now()),
  ('rol-cajero', 'Cajero', 'CAJERO', 'Manejo de caja diaria.', false, true,
   '{"windows":["/","/caja","/ventas/nueva","/productos"]}', now(), now())
ON CONFLICT ("slug") DO UPDATE SET
  "showInEmployees" = EXCLUDED."showInEmployees",
  "permissions" = EXCLUDED."permissions",
  "isSystem" = EXCLUDED."isSystem";

-- 3) Asegurar que el rol ADMIN exista y esté marcado como sistema
INSERT INTO "Role" ("id", "name", "slug", "description", "isSystem", "showInEmployees", "permissions", "createdAt", "updatedAt")
VALUES
  ('rol-admin', 'Administrador', 'ADMIN', 'Administrador: acceso total.', true, false,
   '{"windows":["/","/ventas/nueva","/caja","/pago-proveedores","/productos","/categorias","/proveedores","/metricas","/caja/semanal","/ventas","/pago-proveedores/historial","/caja/historial","/empleados","/configuracion/pagos","/sistema/usuarios","/sistema/perfil","/sistema/apariencia","/sistema/roles"]}', now(), now())
ON CONFLICT ("slug") DO UPDATE SET
  "isSystem" = true;

-- 3b) REGLA DE NEGOCIO: el UNICO rol del sistema es ADMIN.
--     Todo rol que no sea ADMIN debe quedar isSystem=false (Owner/Encargado/Vendedor/Cajero son editables).
UPDATE "Role" SET "isSystem" = false WHERE "slug" <> 'ADMIN';

-- 4) Vincular el usuario admin al rol ADMIN real (marca blanca: la admin no depende del nombre)
UPDATE "User"
SET "roleId" = (SELECT "id" FROM "Role" WHERE "slug" = 'ADMIN'),
    "role" = 'ADMIN'
WHERE "username" = 'admin' OR "email" = 'admin@sistema.com';

-- 5) Si hay otros usuarios con role='OWNER'/'MANAGER' sueltos, vincularlos a sus roles
UPDATE "User" SET "roleId" = (SELECT "id" FROM "Role" WHERE "slug" = 'OWNER') WHERE "role" = 'OWNER' AND "roleId" IS NULL;
UPDATE "User" SET "roleId" = (SELECT "id" FROM "Role" WHERE "slug" = 'MANAGER') WHERE "role" = 'MANAGER' AND "roleId" IS NULL;

-- ============================================================
--  VERIFICACIÓN (opcional, correr aparte):
--  SELECT "slug", "isSystem", "showInEmployees" FROM "Role";
--  SELECT u."username", u."role", u."roleId" FROM "User" u;
-- ============================================================
