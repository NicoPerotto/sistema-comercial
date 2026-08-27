-- ============================================================
-- RESET COMPLETO + RECREATE + SEED (borra y empezamos de nuevo)
-- Pegar y ejecutar ESTE ÚNICO SCRIPT en el SQL Editor de Supabase.
-- NO conserva datos (según lo indicado).
-- Incluye: todas las tablas (con SystemConfig), roles/admin, y registro
-- de migraciones para que Vercel `migrate deploy` no reintente.
-- ============================================================

-- 1) Borrar todo el schema public y recrearlo
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2) Tablas
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SELLER',
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT NOT NULL DEFAULT '{"windows":[]}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Package',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "subcategory" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "barcode" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "cost" DECIMAL(65,30),
    "hasIva" BOOLEAN NOT NULL DEFAULT false,
    "margin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "sellByWeight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isArqueable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashRegister" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "openingAmount" DECIMAL(65,30) NOT NULL,
    "closingAmount" DECIMAL(65,30),
    "expectedAmount" DECIMAL(65,30),
    "difference" DECIMAL(65,30),
    "depositAmount" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CashRegister_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "type" TEXT NOT NULL,
    "auditLog" TEXT,
    "paymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "cashRegisterId" TEXT,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "cost" DECIMAL(65,30),
    "hasIva" BOOLEAN NOT NULL DEFAULT false,
    "margin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "paidFromCash" BOOLEAN NOT NULL DEFAULT false,
    "supplierId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "cashRegisterId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyClosure" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalExpected" DECIMAL(65,30) NOT NULL,
    "totalReal" DECIMAL(65,30) NOT NULL,
    "difference" DECIMAL(65,30) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyClosure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyClosureDetail" (
    "id" TEXT NOT NULL,
    "weeklyClosureId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "expectedAmount" DECIMAL(65,30) NOT NULL,
    "realAmount" DECIMAL(65,30) NOT NULL,
    "difference" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "WeeklyClosureDetail_pkey" PRIMARY KEY ("id")
);

-- Tabla de branding (nombre + tema) — singleton
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT 'PPG Gestión Comercial',
    "description" TEXT NOT NULL DEFAULT 'Sistema avanzado de gestión comercial, stock y ventas',
    "sidebarTitle" TEXT NOT NULL DEFAULT 'PPG',
    "sidebarSubtitle" TEXT NOT NULL DEFAULT 'Gestión Comercial',
    "theme" TEXT NOT NULL DEFAULT 'warm-sand',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- 3) Índices únicos
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
CREATE UNIQUE INDEX "PaymentMethod_name_key" ON "PaymentMethod"("name");
CREATE UNIQUE INDEX "CashRegister_shortId_key" ON "CashRegister"("shortId");
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
CREATE UNIQUE INDEX "SupplierPayment_shortId_key" ON "SupplierPayment"("shortId");
CREATE UNIQUE INDEX "WeeklyClosure_shortId_key" ON "WeeklyClosure"("shortId");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- 4) Foreign keys
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashRegister" ADD CONSTRAINT "CashRegister_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeeklyClosure" ADD CONSTRAINT "WeeklyClosure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeeklyClosureDetail" ADD CONSTRAINT "WeeklyClosureDetail_weeklyClosureId_fkey" FOREIGN KEY ("weeklyClosureId") REFERENCES "WeeklyClosure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeeklyClosureDetail" ADD CONSTRAINT "WeeklyClosureDetail_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) Seed: roles del sistema + usuario admin (clave: admin)
-- Limpiar por si corre dos veces
DELETE FROM "User";
DELETE FROM "Role";

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

INSERT INTO "User" ("id", "name", "email", "username", "password", "role", "roleId", "createdAt", "updatedAt") VALUES
  ('user_admin', 'Administrador', 'admin@sistema.com', 'admin',
   '$2a$10$2IB30gKqF4uAQ3g/t9kANuDKhCyJAFTBjuY6dVYlV3aAiR.EVHZsy',
   'ADMIN', 'role_owner', NOW(), NOW());

-- 6) Seed: SystemConfig (singleton con defaults de PPG)
INSERT INTO "SystemConfig" ("id", "brandName", "description", "sidebarTitle", "sidebarSubtitle", "theme", "updatedAt")
VALUES ('singleton', 'PPG Gestión Comercial', 'Sistema avanzado de gestión comercial, stock y ventas', 'PPG', 'Gestión Comercial', 'warm-sand', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 7) Registrar migraciones como YA APLICADAS (para que Vercel no reintente)
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

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES
  (gen_random_uuid(), '0001_init_registered', NOW(), '0001_init', 1),
  (gen_random_uuid(), '0002_add_role_model_registered', NOW(), '0002_add_role_model', 1),
  (gen_random_uuid(), '0003_add_system_config_registered', NOW(), '0003_add_system_config', 1)
ON CONFLICT ("id") DO NOTHING;

-- ¡Listo! Pegaste todo de una. La DB queda limpia y lista.
-- Login: admin@sistema.com / admin
