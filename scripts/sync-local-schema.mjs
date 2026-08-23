// Deriva ./schema.local.prisma (SQLite, raíz del proyecto) a partir de
// prisma/schema.prisma (Postgres). Mantiene el MISMO modelo de datos; solo
// cambia el datasource.
//
// Convención (para que Prisma resuelva file:./dev.db igual en CLI y runtime):
//   prisma/schema.prisma     -> Postgres (Vercel, migrate deploy, postinstall)
//   ./schema.local.prisma    -> SQLite   (dev local; dev.db en raíz del proyecto)
// Usar tras editar el modelo: npm run db:sync-local
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcPath = path.join(root, 'prisma', 'schema.prisma');
const outPath = path.join(root, 'schema.local.prisma');

const src = fs.readFileSync(srcPath, 'utf8');

const localDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

const replaced = src.replace(/datasource\s+db\s*\{[\s\S]*?\n\}/, localDatasource);

if (replaced === src) {
  console.error('No se encontró el bloque "datasource db { ... }" para reemplazar en prisma/schema.prisma');
  process.exit(1);
}

fs.writeFileSync(outPath, replaced);
console.log('Generado', outPath, '(SQLite, modelo idéntico al postgres)');
