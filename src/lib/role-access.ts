import { prisma } from '@/lib/db';
import { APP_WINDOWS } from '@/lib/windows';
import { SESSION_COOKIE_NAME, verifySession } from '@/lib/session';
import { CREATE_CREDIT_CUSTOMERS, parseRolePermissions, type RolePermissions } from '@/lib/role-permissions';

export interface ResolvedRoleAccess extends RolePermissions {
  isAdmin: boolean;
}

export async function resolveRoleAccess(userId: string, sessionRole?: string): Promise<ResolvedRoleAccess> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { roleRef: true },
  });
  const isAdmin = sessionRole === 'ADMIN' || dbUser?.roleRef?.slug === 'ADMIN';

  if (isAdmin) {
    return {
      isAdmin: true,
      windows: APP_WINDOWS.map((window) => window.path),
      actions: [CREATE_CREDIT_CUSTOMERS],
    };
  }

  const permissions = dbUser?.roleRef
    ? parseRolePermissions(dbUser.roleRef.permissions)
    : { windows: [], actions: [] };

  return { isAdmin: false, ...permissions };
}

export async function resolveRequestRoleAccess(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;

  const user = await verifySession(token);
  if (!user?.id) return null;

  return {
    user,
    ...(await resolveRoleAccess(user.id, user.role)),
  };
}
