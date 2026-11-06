-- Renombre de la ventana "Cuentas Corrientes" a "A Cuenta".
-- Los permisos de los roles se guardan como JSON con los paths de las ventanas.
-- Sin este reemplazo, los roles no-admin perderían el acceso a la ventana.
UPDATE "Role"
SET "permissions" = REPLACE("permissions", '/cuentas-corrientes', '/a-cuenta')
WHERE "permissions" LIKE '%/cuentas-corrientes%';
