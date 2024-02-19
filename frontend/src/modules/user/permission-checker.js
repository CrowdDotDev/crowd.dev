import Plans from '@/security/plans';

const plans = Plans.values;

/**
 * PermissionChecker
 *
 * This class and methods are handling all authorization logic
 * based on tenant's plan and users' roles.
 */
export class PermissionChecker {
  constructor(tenant, user) {
    this.tenant = tenant;
    this.user = user;
  }

  get currentUserRolesIds() {
    if (!this.user || !this.user.tenants || !this.tenant) {
      return [];
    }

    const tenant = this.user.tenants
      .filter(
        (tenantUser) => tenantUser.status === 'active',
      )
      .find(
        (tenantUser) => tenantUser.tenant.id === this.tenant.id,
      );

    if (!tenant) {
      return [];
    }

    return [...tenant.roles];
  }

  match(permission) {
    if (!permission) {
      return true;
    }

    return this.rolesMatchOneOf(permission.allowedRoles);
  }

  lockedForCurrentPlan(permission) {
    if (!permission) {
      return false;
    }

    if (!this.rolesMatchOneOf(permission.allowedRoles)) {
      return false;
    }

    return !this.planMatchOneOf(permission.allowedPlans);
  }

  lockedForSampleData(permission) {
    if (!permission || !this.tenant) {
      return true;
    }

    if (!this.tenant.hasSampleData) {
      return false;
    }

    return !permission.allowedSampleTenant;
  }

  rolesMatchOneOf(arg) {
    if (!this.currentUserRolesIds || !arg) {
      return false;
    }

    if (Array.isArray(arg)) {
      if (!arg.length) {
        return false;
      }

      return arg.some((role) => {
        return this.currentUserRolesIds.includes(role)
      });
    }

    return this.currentUserRolesIds.includes(arg);
  }

  planMatchOneOf(arg) {
    if (!this.currentTenantPlan) {
      return false;
    }

    if (!arg) {
      return false;
    }

    if (Array.isArray(arg)) {
      if (!arg.length) {
        return false;
      }

      return arg.some(
        (plan) => plan === this.currentTenantPlan,
      );
    }

    return arg === this.currentTenantPlan;
  }

  get currentTenantPlan() {
    if (!this.tenant) {
      return plans.essential;
    }

    if (!this.tenant.plan) {
      return plans.essential;
    }

    return this.tenant.plan;
  }

  get isEmptyTenant() {
    if (!this.isAuthenticated) {
      return true;
    }

    if (!this.user.tenants) {
      return true;
    }

    return !this.user.tenants.some(
      (tenant) => tenant.status === 'active',
    );
  }

  get isEmptyPermissions() {
    if (!this.isAuthenticated) {
      return true;
    }

    if (!this.user.tenants) {
      return true;
    }

    const tenant = this.user.tenants.find(
      (t) => t.status === 'active',
    );

    if (!tenant) {
      return true;
    }

    return !tenant.roles || !tenant.roles.length;
  }

  get isAuthenticated() {
    return (
      Boolean(this.user)
      && Boolean(this.user.id)
    );
  }

  get isEmailVerified() {
    if (!this.isAuthenticated) {
      return false;
    }

    return this.user.emailVerified;
  }
}
