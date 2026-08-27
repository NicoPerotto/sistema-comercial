-- ============================================================
-- SEED manual: roles del sistema + usuario admin (clave: admin)
-- No conserva datos previos (borra roles/usuarios existentes primero).
-- Pegar y ejecutar en el SQL Editor de Supabase (DESPUÉS del reset).
-- La clave 'admin' está hasheada con bcrypt (igual que el repo).
-- ============================================================

-- Limpiar por si corre dos veces
DELETE FROM "User";
DELETE FROM "Role";

-- Roles del sistema (isSystem=true => no editables/eliminables desde la UI)
INSERT INTO "Role" ("id", "name", "slug", "description", "isSystem", "permissions", "createdAt", "updatedAt") VALUES
  ('role_owner', 'Owner', 'OWNER', 'Dueño del sistema: acceso total a todas las ventanas y configuración.', true,
   '{"windows":["/","/ventas/nueva","/caja","/pago-proveedores","/productos","/categorias","/proveedores","/metricas","/caja/semanal","/ventas","/pago-proveedores/historial","/caja/historial","/empleados","/configuracion/pagos","/sistema/apariencia","/sistema/roles"]}',
   NOW(), NOW()),
  ('role_admin', 'Administrador', 'ADMIN', 'Administrador: acceso total a operaciones y administración.', true,
   '{"windows":["/","/ventas/nueva","/caja","/pago-proveedores","/productos","/categorias","/proveedores","/metricas","/caja/semanal","/ventas","/pago-proveedores/historial","/caja/historial","/empleados","/configuracion/pagos","/sistema/apariencia","/sistema/roles"]}',
   NOW(), NOW()),
  ('role_manager', 'Encargado', 'MANAGER', 'Encargado: control de stock y ventas.', true,
   '{"windows":["/","/ventas/nueva","/caja","/pago-proveedores","/productos","/categorias","/proveedores","/metricas","/caja/semanal","/ventas","/pago-proveedores/historial","/caja/historial","/empleados","/configuracion/pagos"]}',
   NOW(), NOW());

-- Usuario admin, asociado al rol OWNER (clave 'admin' hasheada)
INSERT INTO "User" ("id", "name", "email", "password", "role", "roleId", "createdAt", "updatedAt") VALUES
  ('user_admin', 'Administrador', 'admin@sistema.com',
   '$2a$10$2IB30gKqF4uAQ3g/t9kANuDKhCyJAFTBjuY6dVYlV3aAiR.EVHZsy',
   'ADMIN', 'role_owner', NOW(), NOW());

-- ¡Listo! Podés loguearte con admin@sistema.com / admin
