# Plan: Proyecto de dos entornos (Local SQLite ↔ Vercel+Supabase Postgres)

> **For Hermes:** Ejecutar con subagent-driven-development, tarea por tarea, con revisión de cumplimiento de spec y luego de calidad.

**Goal:** Dejar el repo consistente para **dos entornos distintos**: desarrollo local contra SQLite (offline, sin Supabase) y producción en Vercel contra Supabase Postgres — usando el **mismo modelo de datos**, sin duplicar lógica y sin secretos en el repo.

**Contexto (confirmado con el usuario):**
- Producción corre en **Vercel + Supabase (Postgres)**. El `provider = "postgres"` actual en `schema.prisma` es correcto para ese entorno.
- **Local NO se conecta a Supabase**: se desarrolla contra SQLite (`file:./dev.db`), offline.
- **Convención de rutas DESCUBIERTA (crítica):** Prisma resuelve `file:./dev.db` relativo al cwd en runtime y relativo al dir del schema en el CLI. Para que coincidan, `schema.local.prisma` y `dev.db` deben estar en la **RAÍZ del proyecto**. El CLI no carga `.env` en runtime → `lib/db.ts` debe hacer `import 'dotenv/config'`. Para local se usa `prisma db push --schema=./schema.local.prisma` (no `migrate dev`, que escanea `prisma/migrations/` sin flag para cambiarlo en 5.22). `Prisma.Decimal` tiene `toJSON()` → el replacer de `JSON.stringify` no sirve; `jsonSafe` debe recorrer en profundidad y usar `.toNumber()`.


**Estado roto actual:**
- `schema.prisma` dice `postgres` pero `.env` local dice `file:./dev.db` y `migration_lock.toml` dice `sqlite` → `prisma validate` falla (P1012).
- Las migraciones existentes son SQL de **SQLite** (`DATETIME`, `INTEGER`, `CURRENT_TIMESTAMP`) que Postgres rechaza.
- El cliente en `node_modules/.prisma/client` es *stale* (generado cuando el schema era sqlite).
- Bug latente: `src/app/api/sales/route.ts` (GET) devuelve `NextResponse.json({ sales, ... })` sin convertir `Prisma.Decimal` → se serializa mal en runtime.
- `dotenv` NO está en `package.json` pero `prisma/seed.ts` hace `import 'dotenv/config'` → el seed falla.
- `prisma/dev.db` está versionado en git (`M prisma/dev.db`).

**Arquitectura:**
- `prisma/schema.prisma` → **postgres** (fuente de verdad; lo usa Vercel, `postinstall`, `build`, y `migrate deploy`).
- `prisma/schema.local.prisma` → **sqlite**, modelo idéntico, generado desde el anterior por un script (`scripts/sync-local-schema.mjs`) para evitar drift. Lo usa el dev local y `migrate dev` local.
- Migraciones separadas: `prisma/migrations/postgres/` y `prisma/migrations/sqlite/`.
- Conmutación por `--schema` (no por prefix de env, para ser cross-platform en Windows).
- Vercel: `DATABASE_URL` (pooled, 6543) + `DIRECT_URL` (directo, 5432) + `AUTH_SECRET`. Local: `.env` solo con `DATABASE_URL="file:./dev.db"`.

**Stack:** Next.js 16.1, React 19, Prisma 5.22, SQLite (local) / PostgreSQL-Supabase (prod), `bcryptjs` (hash), `jose` (JWT, Fase 3), PWA (Fase 4, opcional).

---

## Fase 0 — Resultado de verificación
- `prisma.config.ts` NO disponible en 5.22 → se descarta la Opción A.
- Se adopta **Opción B (dos schemas + `--schema`)**. Confirmado viable en 5.22 (el flag `--schema` siempre existió).

---

## Fase 1 — Estructura de dos entornos

### Task 1: `schema.prisma` queda postgres + `directUrl` + `binaryTargets`
**Files:** Modify `prisma/schema.prisma:1-9`
**Step 1:** Reemplazar datasource/generator por:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (pgbouncer) — runtime en Vercel
  directUrl = env("DIRECT_URL")     // directo (5432) — para prisma migrate
}

generator client {
  provider      = "prisma-client-js"
  engineType    = "library"
  binaryTargets = ["native", "rhel-openssl-3.0.x"] // build de Vercel (linux)
}
```
**Step 2 (verify):** `npx prisma validate --schema=prisma/schema.prisma` → OK (requiere `DATABASE_URL` postgres en env; en local NO se corre este, se corre el local).
**Step 3:** commit.

### Task 2: Script que deriva el schema local (sqlite) del postgres — sin drift
**Files:** Create `scripts/sync-local-schema.mjs`.
**Step 1:** Script que lee `prisma/schema.prisma`, reemplaza el bloque `datasource` por la versión sqlite y escribe `prisma/schema.local.prisma`:
```js
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('prisma');
const src = fs.readFileSync(path.join(root, 'schema.prisma'), 'utf8');

const localDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

// Reemplaza el primer bloque datasource { ... }
const out = src.replace(/datasource\s+db\s*\{[\s\S]*?\n\}/, localDatasource);

if (out === src) { console.error('No se encontró el bloque datasource para reemplazar'); process.exit(1); }
fs.writeFileSync(path.join(root, 'schema.local.prisma'), out);
console.log('Generado prisma/schema.local.prisma (sqlite)');
```
**Step 2:** `node scripts/sync-local-schema.mjs`.
**Step 3 (verify):** `npx prisma validate --schema=prisma/schema.local.prisma` → OK (con `.env` local sqlite).
**Step 4:** commit.

### Task 3: Migraciones separadas por entorno
**Files:** Delete `prisma/migrations/20260128195459_init/` y `prisma/migrations/20260724120000_add_product_brand_subcategory/`; Create `prisma/migrations/postgres/0001_init/migration.sql` y `prisma/migrations/sqlite/0001_init/migration.sql`.
**Step 1:** Borrar migraciones sqlite viejas.
**Step 2 (postgres):** `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/postgres/0001_init/migration.sql`
**Step 3 (sqlite):** `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.local.prisma --script > prisma/migrations/sqlite/0001_init/migration.sql`
**Step 4 (verify):** postgres usa `TIMESTAMP(3)`/`numeric`; sqlite usa `DATETIME`/`INTEGER`. `head` de cada uno.
**Step 5:** commit.

### Task 4: `.env` local (SQLite) + `.env.example`
**Files:** Modify `.env` (gitignored); Create `.env.example` (versionado, sin secretos).
**Step 1:** `.env` local solo:
```
DATABASE_URL="file:./dev.db"
```
**Step 2:** `.env.example` documenta ambos (SIN passwords reales, usando marcadores):
```
# LOCAL (default, offline)
DATABASE_URL="file:./dev.db"

# PROD (Vercel) — completar en Vercel Environment Variables con las URLs reales de Supabase:
#   DATABASE_URL = postgres pooled (host ...pooler.supabase.com:6543, ?pgbouncer=true)  [ya configurada en Vercel]
#   DIRECT_URL  = postgres directo (host ...supabase.co:5432, sin pgbouncer)
#   AUTH_SECRET = <random>
# Nota: el secreto de la URL pooled ya está en Vercel; NO se commitea aquí.
```
**Step 3 (verify):** `npx prisma validate --schema=prisma/schema.local.prisma` → OK sin red.

### Task 5: Scripts npm por perfil (cross-platform)
**Files:** Modify `package.json` scripts.
```json
"dev":               "prisma generate --schema=prisma/schema.local.prisma && next dev --webpack",
"build":             "next build --webpack",
"start":             "next start",
"lint":              "eslint",
"db:local:generate": "prisma generate --schema=prisma/schema.local.prisma",
"db:local:migrate":  "prisma migrate dev --schema=prisma/schema.local.prisma",
"db:sync-local":     "node scripts/sync-local-schema.mjs",
"db:prod:migrate":   "prisma migrate deploy",
"postinstall":       "prisma generate"
```
> `postinstall` genera el cliente postgres (para Vercel). Local lo pisa con `db:local:generate`/`dev`. Sin prefix de env → funciona en Windows.
**Step (verify):** `npm run db:local:migrate` crea `prisma/dev.db` y lo deja al día. `npm run dev` genera cliente sqlite y arranca.
**Step:** commit.

### Task 6: Sacar `dev.db` del repo + `dotenv`
**Files:** Modify `.gitignore`; Modify `package.json` (devDependencies); `git rm --cached`.
**Step 1:** `.gitignore`: agregar `prisma/dev.db`, `prisma/dev.db-journal`, `prisma/*.db`.
**Step 2:** `git rm --cached prisma/dev.db`; borrar físico.
**Step 3:** `npm i -D dotenv` (el seed lo requiere).
**Step 4 (verify):** `npx tsx prisma/seed.ts` corre sin "Cannot find module 'dotenv'".
**Step 5:** commit.

### Task 7: Aplicar esquema a Supabase (prod)
**Objective:** Llevar la DB de Supabase al día sin romper lo que corre en Vercel.
**Variante A — DB vacía:** `npx prisma migrate deploy` (usa `schema.prisma` postgres + `DIRECT_URL`).
**Variante B — DB ya tiene tablas:** `npx prisma migrate resolve --applied 0001_init` (marca baseline) o `prisma migrate diff --from-url $DIRECT_URL --to-schema-datamodel prisma/schema.prisma --script` para aplicar diferencias a mano.
> NUNCA `migrate dev` contra producción. Requiere las URLs reales de Supabase (ya en Vercel env; NO en el repo).
**Step (verify):** En Supabase → Table Editor aparecen las tablas.

---

## Fase 2 — Fix de serialización de `Decimal` (bug latente)
**Files:** Create `src/lib/json.ts`; Modify rutas que devuelven entidades (`sales/route.ts`, `products/route.ts`, `products/bulk/route.ts`, `dashboard/stats/route.ts`, `cash-register/*`, `suppliers`, `supplier-payments`, `weekly-closure/*`, `employees`, `categories`, `payment-methods`).
**Step 1:** Util:
```ts
import { Prisma } from '@prisma/client';
function replacer(_k: string, v: unknown) {
  return v instanceof Prisma.Decimal ? v.toNumber() : v;
}
export function jsonSafe<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, replacer)) as T;
}
```
**Step 2:** Envolver cada respuesta: `return NextResponse.json(jsonSafe(result))`.
**Step 3 (verify):** `npm run dev` + `curl localhost:3000/api/products` → `price` es número (no `{}`).
**Step 4:** commit por grupo de rutas.

---

## Fase 3 — Hardening de seguridad
### Task 8: Hash de passwords
**Files:** `npm i bcryptjs && npm i -D @types/bcryptjs`; Modify `prisma/seed.ts`, `src/app/api/setup/route.ts`, `src/app/api/auth/login/route.ts`.
**Step 1:** seed/setup: `password: await bcrypt.hash('admin', 10)`.
**Step 2:** login: `await bcrypt.compare(password, user.password)`.
**Step 3 (verify):** `admin/admin` sigue logueando; columna `password` ya no es texto plano.
**Step 4:** commit.
> ⚠️ Usuarios existentes en Supabase (texto plano) dejarán de loguear hasta re-seed o script de migración de hashes.

### Task 9: Sesión firmada en cookie httpOnly
**Problema:** cookie `user_session` `httpOnly:false` con usuario en JSON (falsificable); `AuthProvider` usa `localStorage` (XSS).
**Files:** `npm i jose`; Modify login/route.ts (JWT HS256, cookie httpOnly), crear `GET /api/auth/me`, `src/components/AuthProvider.tsx` (fetch `/api/auth/me`), `src/app/api/auth/logout/route.ts`.
**Step 1:** Login emite JWT firmado (`AUTH_SECRET`) en cookie `httpOnly:true, sameSite:'lax', secure:true en prod, maxAge: 1 día`.
**Step 2:** `/api/auth/me` verifica y devuelve usuario sin password.
**Step 3:** `AuthProvider` lee de `/api/auth/me`.
**Step 4 (verify):** DevTools → cookie no legible; manipularla → 401.
**Step 5:** commit.

---

## Fase 4 — PWA real (OPCIONAL — exigida por el spec original)
> Spec: *"EL SISTEMA DEBE SER UNA PWA. Las ventas deben guardarse en local si no hay conexión y luego enviarse al servidor."* Hoy NO se cumple.
**Files:** Add PWA lib compatible Next 16; Create `public/manifest.webmanifest`, SW, `src/app/[offline]`; registrar SW en `layout.tsx`; cola offline de ventas en `src/app/ventas/nueva/page.tsx` (IndexedDB + reintento al reconectar).
**Step 1:** Precache de shell + runtime cache de assets.
**Step 2:** `manifest.webmanifest` (`display:standalone`, icons, `start_url`).
**Step 3:** Cola offline: si `fetch` falla, encolar venta y reenviar al volver online.
**Step 4 (verify):** Lighthouse instalable; offline → venta queda en cola y sincroniza al reconectar.
**Step 5:** commit.
> ✋ Confirmar con el usuario si esta fase entra en esta tanda.

---

## Riesgos y trade-offs
- **`prisma.config.ts` no existe en 5.22** → dos schemas (`--schema`). El drift se previene con `scripts/sync-local-schema.mjs` (siempre que se edite el modelo, correr `npm run db:sync-local`).
- **DB de Supabase ya poblada:** si Vercel "corre" hoy, la DB puede tener tablas. Usar Variante B (resolve --applied) o diff manual. NUNCA `migrate dev` en prod.
- **Passwords en texto plano existentes:** hashear rompe login de usuarios viejos hasta reseed/reset.
- **Vercel necesita `DIRECT_URL`** (conexión directa 5432, sin pgbouncer) para `migrate`; `DATABASE_URL` pooled (6543) para runtime. Se deriva del host del pooled cambiando `.pooler.`→`.` y puerto 6543→5432.
- **`.env` local con secretos:** no commitear (ya en `.gitignore`); el secreto de Supabase vive solo en Vercel.

## Validación final
1. Local: `npm run db:local:migrate` → `dev.db` al día. `npm run dev` → login + venta OK; `curl /api/products` devuelve números. Sin red/Supabase.
2. Prod: `npx prisma migrate deploy` (o resolve --applied) → esquema en Supabase. Variables en Vercel (`DATABASE_URL` pooled, `DIRECT_URL`, `AUTH_SECRET`). Redeploy → app operativa.
3. (Fase 3) cookie httpOnly firmada; (Fase 4 si aplica) Lighthouse instalable + offline sync.
