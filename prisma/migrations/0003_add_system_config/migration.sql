-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT 'PPG Gestión Comercial',
    "description" TEXT NOT NULL DEFAULT 'Sistema avanzado de gestión comercial, stock y ventas',
    "sidebarTitle" TEXT NOT NULL DEFAULT 'PPG',
    "sidebarSubtitle" TEXT NOT NULL DEFAULT 'Gestión Comercial',
    "theme" TEXT NOT NULL DEFAULT 'warm-sand',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- Seed inicial (singleton)
INSERT INTO "SystemConfig" ("id", "brandName", "description", "sidebarTitle", "sidebarSubtitle", "theme", "updatedAt")
VALUES ('singleton', 'PPG Gestión Comercial', 'Sistema avanzado de gestión comercial, stock y ventas', 'PPG', 'Gestión Comercial', 'warm-sand', NOW())
ON CONFLICT ("id") DO NOTHING;
