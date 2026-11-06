# Plan: módulo "A Cuenta" + límite de crédito por cliente

Estado: **implementado** (2026-11-03)
Fecha: 2026-11-03
Proyecto: `sistema-comercial`

---

## 1. Objetivo

1. Renombrar la ventana hoy llamada **"Cuentas Corrientes"** a **"A Cuenta"**, porque
   "Cuenta corriente" es además el nombre de un método de pago y se presta a confusión.
2. Agregar **límite de crédito por cliente**, que controla la **deuda acumulada**, con
   aviso (no bloqueante) y marca en la venta cuando se excede.
3. Dejar la pantalla "A Cuenta" como una **lista de personas con su deuda actual**.

---

## 2. Reglas de negocio

### 2.1 Clientes a cuenta

- El **nombre es obligatorio**; DNI, teléfono, dirección y email son opcionales.
- Campos opcionales vacíos se guardan como `NULL`.
- El **DNI es único** cuando se carga.
- Un cliente con ventas o cobros asociados **no se puede eliminar**: solo desactivar.
- Un cliente **desactivado** no se puede usar en ventas a cuenta ni recibir cobros.

### 2.2 Venta a cuenta

- La venta va a deuda cuando el **método de pago tiene `isCredit = true`**.
- `isCredit` es una **flag por método**: puede haber **varios** métodos marcados y todos
  mandan la venta a la misma bóveda de deudores.
- Si el método es de crédito, es **obligatorio** elegir un cliente activo.
- La venta guarda `paymentMethodId`, `creditCustomerId` y `userId` (vendedor).
- Las ventas **"No realizada"** no generan deuda ni consumen límite.
- Las ventas **canceladas** no cuentan para la deuda.

### 2.3 Deuda

```
deuda = Σ ventas COMPLETED con creditCustomerId − Σ cobros aplicados (CreditPayment.appliedAmount)
```

- Redondeo a 2 decimales.
- Se considera deuda real si supera `0,009`.
- `disponible = límite − deuda` (puede ser negativo si está excedido).

### 2.4 Límite de crédito

- `creditLimit` **vacío / null = sin límite**.
- Controla la **deuda acumulada**: se permite si `deuda + total de la venta ≤ límite`.
- Tolerancia de **0,01** por redondeo.
- **Bajar el límite por debajo de la deuda: se permite.** El cliente queda "Excedido"
  hasta que pague.
- **Los cobros nunca se bloquean** por el límite.
- El importe ingresado para un cobro es el bruto recibido. El neto aplicado a la deuda es
  `importe recibido / (1 + porcentaje / 100)`, redondeado a 2 decimales. El cierre de caja
  contabiliza el importe bruto recibido.

### 2.5 Avisos por límite

| Caso | Situación | Comportamiento |
|---|---|---|
| **A** | Ya está excedido al elegir el cliente | Aviso **antes de la venta** (deuda, límite y exceso) + confirmación **Sí/No**. Si confirma, la venta se registra con la flag. |
| **B** | Estaba dentro y esta venta lo pasa | La venta **se registra igual** (no se bloquea) y el aviso aparece **posventa**: "El cliente quedó excedido por $X". Venta con flag. |
| **C** | Sigue dentro del límite | Sin avisos. |

Además: en el carrito se muestra el **disponible en vivo** (informativo, no bloquea).

### 2.6 Cobros

- Requieren **caja abierta**.
- Importe **mayor a cero**.
- **No se puede cobrar con un método `isCredit`**.
- **No se permite sobrepagar** (tolerancia 0,01).
- El cobro queda asociado a usuario, método de pago y caja; impacta en cierre de caja
  diario y cierre semanal.
- `CreditPayment.amount` conserva el importe bruto recibido y `appliedAmount` el neto que
  reduce la deuda. Para cobros anteriores con `appliedAmount = null`, se usa `amount`.
- El permiso de acción **Crear clientes** se configura aparte del acceso a la ventana
  "A Cuenta"; controla el alta, no la consulta ni los cobros.

---

## 3. Modelo de datos

### 3.1 Cambios en `prisma/schema.prisma`

```prisma
model CreditCustomer {
  // ...campos actuales...
  creditLimit Decimal?   // null = sin límite
}

model Sale {
  // ...campos actuales...
  creditLimitExceeded Boolean  @default(false) // la venta superó el límite al registrarse
  creditLimitAtSale   Decimal?                 // foto del límite vigente al momento de la venta
}

model CreditPayment {
  // ...campos actuales...
  appliedAmount Decimal? // neto aplicado a la deuda; null en cobros previos
}
```

- No se renombran los modelos `CreditCustomer` / `CreditPayment`: "credit" es genérico
  y renombrarlos implicaría migrar FKs sin beneficio.
- `Sale.creditLimitAtSale` queda para auditoría (permite explicar por qué se marcó).

### 3.2 Migración

Migraciones:

- `20261104014334_add_credit_limit` (columnas nuevas):

```sql
ALTER TABLE "CreditCustomer" ADD COLUMN "creditLimit" DECIMAL(65,30);
ALTER TABLE "Sale" ADD COLUMN "creditLimitAtSale" DECIMAL(65,30),
ADD COLUMN "creditLimitExceeded" BOOLEAN NOT NULL DEFAULT false;
```

- `20261104020000_rename_a_cuenta_permissions` (datos de roles):

```sql
UPDATE "Role"
SET "permissions" = REPLACE("permissions", '/cuentas-corrientes', '/a-cuenta')
WHERE "permissions" LIKE '%/cuentas-corrientes%';
```

- `20261104195000_add_credit_payment_applied_amount` (importe neto aplicado a la deuda):

```sql
ALTER TABLE "CreditPayment" ADD COLUMN "appliedAmount" DECIMAL(65,30);
```

- Aplicar en local con `npx prisma migrate dev`.
- Actualizar `schema.local.prisma` (copia SQLite) para mantener consistencia.
- Producción: `npx prisma migrate deploy` o `npm run db:prod:migrate`.

---

## 4. Renombre a "A Cuenta"

### 4.1 Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/app/cuentas-corrientes/` | Mover a `src/app/a-cuenta/` |
| `src/app/a-cuenta/page.tsx` | Título "A Cuenta" |
| `src/components/Sidebar.tsx` | `href: '/a-cuenta'`, label `'A Cuenta'` |
| `src/lib/windows.ts` | `{ path: '/a-cuenta', label: 'A Cuenta', section: 'Operaciones' }` |

### 4.2 Migración de permisos de roles (crítico)

Los permisos se guardan como JSON con paths en `Role.permissions`, y
`parsePermissions()` descarta los paths que no existan en `APP_WINDOWS`.
Si solo se cambia el path, **los roles no-admin pierden el acceso en silencio**.

Acciones:
1. Script/migración que recorra `Role.permissions` y reemplace
   `/cuentas-corrientes` por `/a-cuenta`.
2. Verificar después que cada rol conservó la ventana.
3. Mantener `/sistema/roles` mostrando la ventana nueva.

### 4.3 Compatibilidad

- Redirect `/cuentas-corrientes` → `/a-cuenta` (page o `redirect()`), para accesos
  guardados o links viejos. Opcional pero recomendado.

### 4.4 Métodos de pago

En `src/app/configuracion/pagos/page.tsx`:
- Renombrar la etiqueta del checkbox de `isCredit` a **"Genera deuda (a cuenta)"**.
- Texto de ayuda: "Puede haber varios métodos marcados. Las ventas con estos métodos
  quedan asociadas a un cliente a cuenta. Un método marcado no sirve para cobrar deudas."

---

## 5. API

### 5.1 `POST /api/sales` (`src/app/api/sales/route.ts`)

Dentro de la **misma transacción** que crea la venta:

1. Si `paymentMethod.isCredit`:
   - Exigir `creditCustomerId` activo (ya existe).
2. Si el cliente tiene `creditLimit`:
   - Calcular deuda actual: `Σ ventas COMPLETED − Σ cobros` del cliente.
   - `excedidoAntes = deuda > limite + 0.01`.
   - `excederiaConVenta = deuda + total > limite + 0.01`.
3. Reglas:
   - `excedidoAntes && !confirmOverLimit` → responder
     `409 { error: 'CREDIT_LIMIT_EXCEEDED', limit, currentDebt, available, saleTotal, excess }`.
   - `excedidoAntes && confirmOverLimit` → crear con `creditLimitExceeded = true`.
   - `!excedidoAntes && excederiaConVenta` → crear con `creditLimitExceeded = true`
     (sin bloquear) y devolver `creditLimitExceeded: true` en la respuesta.
   - Caso contrario → crear normal, `creditLimitExceeded = false`.
4. Guardar `creditLimitAtSale = creditLimit` cuando la venta es a cuenta.
5. La respuesta incluye `creditLimitExceeded`, `newBalance`, `limit`, `available`
   para que el POS muestre el aviso posventa.

### 5.2 `GET/POST/PUT /api/credit-customers`

- Aceptar y validar `creditLimit`:
  - número ≥ 0, o `null`/vacío = sin límite.
  - redondear a 2 decimales.
- Devolver en cada cliente: `creditLimit`, `available`, `overLimit` (booleano).
- `withBalance()` calcula `available` y `overLimit`.

### 5.3 `GET /api/credit-customers/[id]`

- Devolver `creditLimit`, `available`, `overLimit`.
- Incluir `creditLimitExceeded` en las ventas del detalle.

### 5.4 `POST /api/credit-payments`

- El importe recibido se guarda en `amount`; el neto que reduce la deuda se guarda en
  `appliedAmount`, calculado como `amount / (1 + paymentMethod.percentage / 100)`.
- El cierre diario y semanal contabiliza `amount` (bruto recibido); la deuda usa
  `appliedAmount`. En los cobros existentes, `appliedAmount = null` se interpreta como `amount`.
- No validar límite (los cobros siempre se permiten).

---

## 6. Interfaz

### 6.1 Página "A Cuenta" (`/a-cuenta`)

**Encabezado (resumen):**
- Total adeudado.
- Clientes con deuda / clientes excedidos.

**Tabla:**

| Cliente | Contacto | Deuda actual | Límite | Disponible | Estado | Último mov. | Acciones |
|---|---|---|---|---|---|---|---|
| Juan Pérez · DNI 30.123.456 | 11-5555-5555 | $45.000 | $50.000 | $5.000 | Al día | 02/11 | Cobrar · Ver · Editar |
| María Gómez · DNI 27.888.111 | — | $62.000 | $50.000 | −$12.000 | Excedido | 01/11 | Cobrar · Ver · Editar |
| Pedro Ruiz | — | $18.000 | Sin límite | — | Sin límite | 28/10 | Cobrar · Ver · Editar |

- Orden por defecto: **mayor deuda primero**.
- Búsqueda por nombre o DNI.
- Filtros: **Todos · Con deuda · Excedidos · Inactivos**.
- Badge **"Excedido"** cuando `deuda > límite`.
- "Ver" abre el detalle con ventas, cobros y saldo.
- Botón "Nuevo cliente".

**Alta/edición de cliente:**
- Campo **"Límite de crédito"** (vacío = sin límite), con ayuda "Dejalo vacío para sin límite".
- Resto de campos igual que hoy.

### 6.2 POS (`/ventas/nueva`)

- Al elegir cliente a cuenta: mostrar **deuda, límite y disponible**.
- Si ya está excedido: banner rojo + confirmación **Sí/No** antes de cobrar (caso A).
- En el carrito: indicador en vivo del disponible (informativo).
- Postventa: si la venta excedió el límite, aviso "El cliente quedó excedido por $X"
  (caso B) y la venta queda marcada.

### 6.3 Historial de Ventas (`/ventas`)

- Badge **"Excedió límite"** en las ventas con `creditLimitExceeded = true`.
- En el detalle de la venta, mostrar el límite vigente (`creditLimitAtSale`) y el cliente.
- El vendedor ya se muestra (columna existente, `Sale.userId`).

---

## 7. Pruebas

### 7.1 Escenarios funcionales

1. Cliente **sin límite** → venta a cuenta sin avisos, deuda aumenta.
2. Cliente con límite, venta **dentro** del límite → sin avisos.
3. Venta que deja la deuda **justo en el límite** → sin aviso (tolerancia 0,01).
4. Cliente **ya excedido** → API responde `409 CREDIT_LIMIT_EXCEEDED` sin confirmación.
5. Cliente ya excedido + confirmación → venta creada con `creditLimitExceeded = true`.
6. Cliente dentro del límite + venta que lo pasa → venta creada, flag activa,
   respuesta con `creditLimitExceeded: true`.
7. Cobro parcial → deuda baja; el cliente puede volver a "Al día".
8. **Bajar el límite** por debajo de la deuda → permitido, cliente "Excedido".
9. Método de pago `isCredit` **no** permite cobrar deuda.
10. Cliente desactivado → no se puede vender a cuenta ni cobrar.
11. Venta "No realizada" → no genera deuda ni consume límite.
12. Venta cancelada → no cuenta en la deuda.
13. Varios métodos con `isCredit` → todos piden cliente y van a deudores.

### 7.2 Renombre y permisos

14. `/a-cuenta` carga con la lista y las deudas correctas.
15. Un rol no-admin conserva el acceso después de la migración de permisos.
16. `/cuentas-corrientes` redirige a `/a-cuenta`.
17. Sidebar y Gestor de Roles muestran "A Cuenta".

### 7.3 Verificación de base de datos

18. `npx prisma migrate diff --from-schema-datamodel ... --to-schema-datasource ... --script`
    devuelve migración vacía (schema y DB sincronizados).
19. Columnas nuevas presentes en PostgreSQL local.
20. Limpiar todos los datos de prueba al finalizar.

---

## 8. Orden de trabajo

1. Migración de schema (`creditLimit`, `creditLimitExceeded`, `creditLimitAtSale`).
2. Renombre de ruta y labels + migración de permisos + redirect.
3. API de clientes (`creditLimit`, `available`, `overLimit`).
4. API de ventas (validación transaccional, casos A/B/C).
5. POS (aviso preventivo, disponible en vivo, aviso posventa).
6. Página "A Cuenta" (tabla, resumen, filtros, campo de límite).
7. Historial de Ventas (badge).
8. Métodos de Pago (etiqueta del flag y ayuda).
9. Pruebas completas y limpieza de datos.

---

## 9. Riesgos y notas

- **Permisos por path**: sin migrar el JSON de roles, los usuarios no-admin pierden la
  ventana. Es el punto más delicado del renombre.
- **`userId` enviado por el cliente**: la API confía en el id que manda el POS. Es el
  patrón actual del sistema; no se cambia en este trabajo (se puede endurecer después).
- **Producción/Supabase**: la migración debe aplicarse aparte con `migrate deploy`.
- **Método "Cuenta corriente"**: conserva el recargo del 5% de un seed anterior; se puede
  ajustar desde Métodos de Pago.
- **Dos flags distintas**: `PaymentMethod.isCredit` (el método va a deuda) vs
  `Sale.creditLimitExceeded` (la venta se pasó del límite). No confundirlas.

---

## 10. Estado de implementación

### Archivos principales

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | `CreditCustomer.creditLimit`, `Sale.creditLimitExceeded`, `Sale.creditLimitAtSale` |
| `prisma/migrations/20261104014334_add_credit_limit/` | Columnas nuevas |
| `prisma/migrations/20261104020000_rename_a_cuenta_permissions/` | Path de roles |
| `src/app/a-cuenta/page.tsx` | Lista con deuda/límite/disponible/estado, filtro "Excedidos", campo de límite, badges |
| `src/app/cuentas-corrientes/page.tsx` | Redirect a `/a-cuenta` |
| `src/app/api/credit-customers/route.ts` | `creditLimit`, `available`, `overLimit` |
| `src/app/api/credit-customers/[id]/route.ts` | `creditLimit`, `available`, `overLimit` |
| `src/app/api/sales/route.ts` | Validación transaccional y casos A/B/C |
| `src/app/ventas/nueva/page.tsx` | Panel de límite, confirmación pre-venta y aviso posventa |
| `src/app/ventas/page.tsx` | Badge "Excedió límite" y límite en el detalle |
| `src/app/configuracion/pagos/page.tsx` | Etiqueta "Genera deuda (a cuenta)" |
| `src/components/Sidebar.tsx`, `src/lib/windows.ts` | Ventana "A Cuenta" |
| `prisma/seed.ts` | Path `/a-cuenta` |

### Pruebas ejecutadas

- Cliente con límite 200, venta dentro del límite → sin aviso, `creditLimitExceeded = false`.
- Venta que deja la deuda sobre el límite → se registra, `creditLimitExceeded = true`,
  respuesta con `credit.exceeded = true` (caso B).
- Cliente ya excedido sin confirmación → `409 CREDIT_LIMIT_EXCEEDED` con
  `limit`, `currentDebt`, `available`, `saleTotal` y `excess` (caso A).
- Cliente ya excedido con `confirmOverLimit = true` → venta registrada y marcada.
- Cobro parcial → reduce la deuda y el disponible.
- Bajar el límite con deuda → permitido, cliente queda "Excedido".
- Límite vacío → `creditLimit = null`, `overLimit = false`, `available = null`.
- `/a-cuenta` responde 200 y `/cuentas-corrientes` redirige.
- `prisma migrate diff` → migración vacía (schema y DB sincronizados).
- Datos de prueba eliminados y stock restaurado.

### Pendiente

- Aplicar la nueva migración en cada base de datos antes de desplegar la versión
  (`npx prisma migrate deploy` en producción/Supabase).
