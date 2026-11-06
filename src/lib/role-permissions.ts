import { APP_WINDOWS } from '@/lib/windows';

export const CREATE_CREDIT_CUSTOMERS = 'credit-customers:create';

export interface RolePermissions {
  windows: string[];
  actions: string[];
}

const VALID_ACTIONS = new Set([CREATE_CREDIT_CUSTOMERS]);
const VALID_WINDOWS = new Set(APP_WINDOWS.map((window) => window.path));

export function parseRolePermissions(raw: string): RolePermissions {
  try {
    const parsed = JSON.parse(raw);
    const windows = Array.isArray(parsed?.windows)
      ? parsed.windows.filter((path: unknown): path is string => typeof path === 'string' && VALID_WINDOWS.has(path))
      : [];
    const actions = Array.isArray(parsed?.actions)
      ? parsed.actions.filter((action: unknown): action is string => typeof action === 'string' && VALID_ACTIONS.has(action))
      : Object.prototype.hasOwnProperty.call(parsed, 'actions')
        ? []
        : windows.includes('/a-cuenta')
          ? [CREATE_CREDIT_CUSTOMERS]
          : [];

    return { windows, actions };
  } catch {
    return { windows: [], actions: [] };
  }
}

export function sanitizeRolePermissions(windows: unknown, actions: unknown): RolePermissions {
  return {
    windows: Array.isArray(windows)
      ? windows.filter((path: unknown): path is string => typeof path === 'string' && VALID_WINDOWS.has(path))
      : [],
    actions: Array.isArray(actions)
      ? actions.filter((action: unknown): action is string => typeof action === 'string' && VALID_ACTIONS.has(action))
      : [],
  };
}
