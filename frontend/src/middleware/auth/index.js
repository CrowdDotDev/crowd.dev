import AuthGuard from '@/middleware/auth/auth-guard';
import UnauthGuard from '@/middleware/auth/unauth-guard';
// import EmailAlreadyVerifiedGuard from '@/middleware/auth/email-already-verified-guard';
// import PermissionGuard from '@/middleware/auth/permission-guard';
// import NotEmptyTenant from '@/middleware/auth/not-empty-tenant-guard';
// import NotEmptyPermissionsGuard from '@/middleware/auth/not-empty-permissions-guard';

/* Temporarly disabling guards, only AuthGuard has been working before and other caused too much issues when enabled */
export default [
  AuthGuard,
  UnauthGuard,
  // EmailAlreadyVerifiedGuard,
  // PermissionGuard,
  // NotEmptyTenant,
  // NotEmptyPermissionsGuard,
];
