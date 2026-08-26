# Plan: Alineación Supabase/Postgres + Mejoras (PWA Comercial)

> **For Hermes:** Usar subagent-driven-development para ejecutar tarea por tarea, con revisión de cumplimiento de spec y luego de calidad.

**Goal:** Dejar el proyecto consistente con su entorno real de producción (Vercel + Supabase Postgres), corregir la inconsistencia schema/migraciones que rompe `prisma generate`/`validate` en local, arreglar un bug latente de serialización de `Decimal`, y endurecer la seguridad (passwords y sesión). La PWA real queda como fase opcional explícita.

**Contexto / Asunciones:**
- El proyecto YA corre en Vercel con Supabase (Postgres). Por lo tanto el `provider = "postgres"` del commit `e94d6e3` ("CAMBIADO SCHEMA") es **correcto**.
- El error real es que `.env` local sigue apuntando a SQLite (`DATABASE_URL="file:./dev.db"`), el `migration_lock.toml` dice `sqlite`, y las carpetas de migración contienen SQL de **SQLite** (`DATETIME`, `INTEGER`, `CURRENT_TIMESTAMP`) que Postgres rechaza.
- Resultado hoy: `npx prisma validate` falla (P1012), `prisma generate`/`migrate` fallan en local, y el cliente en `node_modules/.prisma/client` es *stale* (generado cuando el schema era sqlite).
- La URL de Supabase está **comentada y con password enmascarado** en `.env`:
  `postgresql://postgres.isfzlpikpqyyhanhitdn:***@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
  → Se necesita la URL real (con password) del dashboard de Supabase para ejecutar migraciones.
- `prisma/dev.db` (SQLite) está versionado en git (`M prisma/dev.db` en status). Hay que sacarlo del repo.
- `dotenv` NO está en `package.json` pero `prisma/seed.ts` hace `import 'dotenv/config'` → el seed falla hoy.

**Arquitectura:** Next.js 16 (App Router) + React 19 en Vercel; Prisma 5.22 como ORM contra Supabase Postgres. En runtime Prisma usa la conexión *pooled* (`?pgbouncer=true`, puerto 6543); para `prisma migrate`/`generate` se usa `directUrl` (conexión directa, puerto 5432, sin pgbouncer). Las migraciones se regeneran en dialecto Postgres.

**Stack:** Next.js 16.1, React 19, Prisma 5.22, PostgreSQL (Supabase), `bcryptjs` (hash), `jose` (JWT de sesión, fase 3), `serwist` o `@ducanh2912/next-pwa` (fase 4 opcional).

---

## Fase 0 — Prerrequisitos (credenciales del usuario)

**Objective:** Obtener las dos cadenas de conexión reales de Supabase antes de ejecutar.

**Paso 1:** En Supabase Dashboard → Project Settings → Database, copiar:
- **URI de conexión (pooler, port 6543, `use pooler` on)** → será `DATABASE_URL`.
- **URI de conexión directa (port 5432, `use pooler` off)** → será `DIRECT_URL`.

Formato esperado:
```
DATABASE_URL="postgresql://postgres.<proj>:<PASSWORD>@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<proj>:<PASSWORD>@aws-0-us-west-2.supabase.co:5432/postgres"
```
> El host del `DIRECT_URL` es `*.supabase.co` (sin `pooler`), puerto `5432`.

**Paso 2 (decisión):** Confirmar si la base de Supabase ya tiene tablas (por `db push` manual previo) o está vacía. Esto define la variante de la Fase 1, Tarea 5.

---

## Fase 1 — Alineación a Postgres/Supabase

### Task 1: Corregir `datasource` en `prisma/schema.prisma`
**Files:** Modify `prisma/schema.prisma:1-9`
**Step 1:** Reemplazar el bloque datasource/generator por:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled (pgbouncer) — runtime
  directUrl = env("DIRECT_URL")     // directo (5432) — migraciones
}

generator client {
  provider      = "prisma-client-js"
  engineType    = "library"
  binaryTargets = ["native", "rhel-openssl-3.0.x"] // build de Vercel (linux)
}
```
**Step 2 (verify):** `npx prisma validate` → esperado: `Environment variables loaded from .env` y sin errores (requiere Fase 0 + Task 4 con valores reales, o al menos formato postgres en `.env`).
**Step 3:** commit `fix: datasource postgres + directUrl + binaryTargets`.

### Task 2: `migration_lock.toml` a postgresql
**Files:** Modify `prisma/migrations/migration_lock.toml`
**Step 1:** Cambiar `provider = "sqlite"` → `provider = "postgresql"`.
**Step 2 (verify):** `cat prisma/migrations/migration_lock.toml` muestra `provider = "postgresql"`.
**Step 3:** commit.

### Task 3: Regenerar migraciones en dialecto Postgres
**Objective:** Las migraciones actuales son SQL de SQLite y no corren en Postgres.
**Files:** Delete `prisma/migrations/20260128195459_init/` y `prisma/migrations/20260724120000_add_product_brand_subcategory/`; Create `prisma/migrations/<timestamp>_init/migration.sql` (Postgres).
**Step 1:** Borrar las dos carpetas de migración sqlite:
```bash
rm -rf prisma/migrations/20260128195459_init prisma/migrations/20260724120000_add_product_brand_subcategory
```
**Step 2:** Generar el SQL Postgres equivalente desde el schema (sin tocar la DB):
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0001_init/migration.sql
```
> Crear la carpeta `0001_init/` primero. El SQL resultante usará `timestamp(3)`, `numeric`, etc. (Postgres), no `DATETIME`/`INTEGER`.
**Step 3 (verify):** `head prisma/migrations/0001_init/migration.sql` muestra `CREATE TABLE "User" (... "createdAt" TIMESTAMP(3) ...)`.
**Step 4:** commit `feat: migraciones postgres baseline`.

### Task 4: `.env` local apunta a Supabase
**Files:** Modify `.env` (gitignored; no commitear)
**Step 1:** Dejar solo las dos URLs reales (de Fase 0):
```
DATABASE_URL="postgresql://postgres.<proj>:<PASSWORD>@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<proj>:<PASSWORD>@aws-0-us-west-2.supabase.co:5432/postgres"
```
(Comentar/eliminar la línea `file:./dev.db`.)
**Step 2 (verify):** `npx prisma validate` → OK.

### Task 5: Aplicar migración a Supabase
**Objective:** Crear/llevar el esquema a Supabase sin romper lo que ya corre en Vercel.
**Variante A — DB vacía o recién creada:**
```bash
npx prisma migrate deploy
```
Esperado: aplica `0001_init` y marca como aplicada.
**Variante B — DB ya tiene tablas (de `db push` previo):**
```bash
# 1) generar SQL (ya hecho en Task 3)
# 2) marcar la baseline como ya aplicada sin re-ejecutar:
npx prisma migrate resolve --applied 0001_init
```
> Si hay drift, usar `npx prisma migrate diff --from-url $DIRECT_URL --to-schema-datamodel prisma/schema.prisma --script` para ver diferencias y aplicarlas a mano.
**Step (verify):** En Supabase → Table Editor aparecen `User`, `Product`, `Sale`, `CashRegister`, etc.
**Step:** commit (no del `.env`).

### Task 6: Variables de entorno en Vercel
**Objective:** Que el build y runtime de Vercel usen Postgres.
**Files:** Vercel Project → Settings → Environment Variables (no archivo).
**Step 1:** Agregar `DATABASE_URL` (pooled, 6543) y `DIRECT_URL` (directo, 5432) para entornos Production/Preview/Development.
**Step 2 (verify):** `vercel env pull .env.local` (opcional) y `npx prisma generate` corre en build (postinstall ya lo hace).
**Step 3:** Trigger redeploy en Vercel para regenerar el cliente Prisma contra el schema postgres.

### Task 7: Quitar `dev.db` de git y agregar `dotenv`
**Files:** Modify `.gitignore`; Modify `package.json` (devDependencies).
**Step 1:** En `.gitignore` agregar:
```
prisma/dev.db
prisma/dev.db-journal
prisma/*.db
```
**Step 2:** `git rm --cached prisma/dev.db` y borrar el archivo físico.
**Step 3:** En `package.json` agregar `"dotenv": "^16.4.5"` a `devDependencies` (el seed lo requiere). Luego `npm install`.
**Step 4 (verify):** `npx tsx prisma/seed.ts` corre sin `Cannot find module 'dotenv'`.
**Step 5:** commit.

---

## Fase 2 — Fix de serialización de `Decimal` (bug latente)

**Problema:** Los modelos usan `Decimal` (ej. `Sale.total`, `Product.price`). `Prisma.Decimal` es un objeto; `NextResponse.json(...)` lanza o serializa `{}` en runtime cuando se devuelven ventas/productos. Hoy "anda" solo porque las rutas quizá no devuelven Decimal directo, pero es una mina.
**Files:** Create `src/lib/json.ts`; Modify rutas API que devuelven entidades (`src/app/api/sales/route.ts`, `products/route.ts`, `dashboard/stats/route.ts`, etc.).
**Step 1:** Crear util:
```ts
import { Prisma } from '@prisma/client';

function replacer(_k: string, v: unknown) {
  if (v instanceof Prisma.Decimal) return v.toNumber();
  return v;
}
export function jsonSafe<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, replacer)) as T;
}
```
**Step 2:** En cada ruta, envolver: `return NextResponse.json(jsonSafe(result))`.
**Step 3 (verify):** `curl` a `/api/products` devuelve `price` como número (no `{}`).
**Step 4:** commit.

---

## Fase 3 — Hardening de seguridad

### Task 8: Hash de passwords
**Files:** Modify `package.json` (add `bcryptjs` + `@types/bcryptjs`); Modify `prisma/seed.ts`, `src/app/api/setup/route.ts`, `src/app/api/auth/login/route.ts`.
**Step 1:** `npm i bcryptjs && npm i -D @types/bcryptjs`.
**Step 2:** En seed/setup crear users con `password: await bcrypt.hash('admin', 10)`.
**Step 3:** En login comparar `await bcrypt.compare(password, user.password)`.
**Step 4 (verify):** login con `admin/admin` sigue funcionando; la columna `password` en Supabase ya no es texto plano.
**Step 5:** commit.

### Task 9: Sesión firmada en cookie httpOnly
**Problema:** Hoy la cookie `user_session` es `httpOnly:false` con el usuario en JSON (falsificable), y `AuthProvider` usa `localStorage` (XSS).
**Files:** Add `jose`; Modify `src/app/api/auth/login/route.ts` (firmar JWT), `src/app/api/auth/me/route.ts` (nuevo, leer sesión), `src/components/AuthProvider.tsx` (leer de `/api/auth/me`, no de localStorage), `src/app/api/auth/logout/route.ts`.
**Step 1:** `npm i jose`.
**Step 2:** Login emite JWT firmado (HS256, secreto desde `process.env.AUTH_SECRET`) en cookie `httpOnly:true, sameSite:'lax', secure:true en prod, maxAge: 1 día`.
**Step 3:** Crear `GET /api/auth/me` que verifica el JWT y devuelve el usuario (sin password).
**Step 4:** `AuthProvider` hace fetch a `/api/auth/me` al montar; elimina el uso de `localStorage`.
**Step 5 (verify):** DevTools → Application → Cookies: `user_session` no legible (httpOnly); manipularla a mano devuelve 401.
**Step 6:** commit.

---

## Fase 4 — PWA real (OPCIONAL — requerida por el spec original)

> El spec original exige: *"EL SISTEMA DEBE SER UNA PWA. Las ventas deben guardarse en local si no hay conexión y luego enviarse al servidor."* Hoy NO se cumple (solo hay un texto "PWA Comercial v1.1" en el login).
**Files:** Add `serwist` (o `@ducanh2912/next-pwa` compatible con Next 16); Create `public/manifest.webmanifest`, `public/sw.js` (o handler de serwist), `src/app/[offline]`; registrar SW en `layout.tsx`; cola offline de ventas en `src/app/ventas/nueva/page.tsx` (IndexedDB/localStorage + reintento al reconectar).
**Step 1:** Instalar y configurar el SW para precache de shell + runtime cache de assets.
**Step 2:** `manifest.webmanifest` con `name`, `short_name`, `icons`, `display:standalone`, `start_url`.
**Step 3:** En la pantalla de venta, si `fetch` falla, encolar la venta localmente y reenviar con `sync`/al volver online.
**Step 4 (verify):** Lighthouse PWA → instalable; probar offline: crear venta, cortar red, la venta queda en cola y se sincroniza al volver.
**Step 5:** commit.
> ✋ Confirmar con el usuario si esta fase entra en este plan o se hace aparte.

---

## Riesgos y trade-offs
- **DB ya poblada en Supabase:** Si Vercel "corre" hoy, la DB puede tener datos. `migrate deploy` sobre una DB con tablas falla → usar Variante B (resolve --applied) o `migrate diff` manual. **Nunca** `migrate dev` contra producción.
- **Passwords actuales en texto plano:** Al hashear, los usuarios existentes (admin/123, prev/123) dejarán de loguear hasta re-seed o reset manual. Planear un reseed o script de migración de hashes.
- **`prisma generate` en Vercel:** necesita `DATABASE_URL` definido en build (el `directUrl` no es obligatorio en build, pero sí `DATABASE_URL` con formato postgres). Ya está en env vars de Vercel.
- **`.env` local con secretos:** no commitear; ya está en `.gitignore`.

## Validación final (end-to-end)
1. `npx prisma validate` → OK.
2. `npx prisma generate` → OK (cliente postgres).
3. `npm run build` → compila (sin error de tipos de Prisma/Decimal).
4. `npm run dev` → login funciona; crear una venta; verificar en Supabase que se escribió.
5. Redeploy en Vercel → app sigue operativa con Supabase.
6. (Fase 3) cookie httpOnly firmada; (Fase 4 si aplica) Lighthouse instalable + offline sync.
