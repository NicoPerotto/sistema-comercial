import { NextResponse } from 'next/server';

/**
 * Convierte Prisma.Decimal a número recorriendo el objeto en profundidad.
 *
 * Nota: no se puede usar el replacer de JSON.stringify, porque Prisma.Decimal
 * implementa toJSON() y JSON.stringify lo convierte a string ANTES de llamar
 * al replacer. Por eso recorremos el objeto nosotros mismos y reemplazamos
 * las instancias de Decimal por su valor numérico antes de serializar.
 *
 * El cheque es por forma (typeof toNumber === 'function') para ser robusto
 * ante múltiples instancias del cliente Prisma (bundle de Next).
 */
type AnyObj = Record<string, unknown>;

function isDecimalLike(v: unknown): v is { toNumber: () => number } {
  return (
    v !== null &&
    typeof v === 'object' &&
    typeof (v as { toNumber?: unknown }).toNumber === 'function'
  );
}

function convertDecimals(value: unknown): unknown {
  if (isDecimalLike(value)) {
    try {
      return value.toNumber();
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    return value.map(convertDecimals);
  }
  if (value && typeof value === 'object') {
    const out: AnyObj = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = convertDecimals(v);
    }
    return out;
  }
  return value;
}

export function jsonSafe<T>(data: T): T {
  return convertDecimals(data) as T;
}

/** NextResponse.json que serializa correctamente los Decimal. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(jsonSafe(data), init);
}
