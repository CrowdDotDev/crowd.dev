import assert from 'assert'
import lodash from 'lodash'
import { Error400, Error403 } from '@crowd/common'
import Plans from '../../security/plans'
import Roles from '../../security/roles'
import Permissions from '../../security/permissions'
import EmailSender from '../emailSender'

const plans = Plans.values
const roles = Roles.values

/**
 * Checks the Permission of the User on a Tenant.
 */
export default class PermissionChecker {
  currentTenant

  language

  currentUser

  adminSegments

  currentSegments

  constructor({ currentTenant, language, currentUser, currentSegments }) {
    this.currentTenant = currentTenant
    this.language = language
    this.currentUser = currentUser
    this.currentSegments = currentSegments
    this.adminSegments = currentUser.tenants.find(
      (t) => t.tenantId === currentTenant.id,
    )?.adminSegments
  }

  /**
   * Validates if the user has a specific permission
   * and throws a Error403 if it doesn't.
   */
  validateHas(permission) {
    if (!this.has(permission)) {
      throw new Error403(this.language)
    }
  }

  /**
   * Validates if the user has any permission among specified
   * and throws Error403 if it doesn't
   */
  validateHasAny(permissions) {
    const hasOne = permissions.some((p) => this.has(p))

    if (!hasOne) {
      throw new Error403(this.language)
    }
  }

  /**
   * Checks if the user has permission to change certain protected
   * fields in an integration.
   * @param data Data sent to the integration write service
   */
  validateIntegrationsProtectedFields(data) {
    if (data.limitCount !== undefined) {
      this.validateHas(Permissions.values.integrationControlLimit)
    }
  }

  /**
   * Checks if the user has permission to change certain protected
   * fields in a microservice.
   * @param data Data sent to the microservice write service
   */
  validateMicroservicesProtectedFields(data) {
    if (data.variant !== undefined) {
      if (data.variant === 'default') {
        this.validateHas(Permissions.values.microserviceVariantFree)
      } else if (data.variant === 'premium') {
        this.validateHas(Permissions.values.microserviceVariantPremium)
      } else {
        throw new Error400(`Invalid variant: ${data.variant}`)
      }
    }
  }

  /**
   * Checks if the user has a specific permission.
   */
  has(permission) {
    assert(permission, 'permission is required')

    if (!this.currentUser) {
      return false
    }

    if (!this.isEmailVerified) {
      return false
    }

    if (!this.hasPlanPermission(permission)) {
      return false
    }

    return this.hasRolePermission(permission)
  }

  /**
   * Validates if the user has access to a storage
   * and throws a Error403 if it doesn't.
   */
  validateHasStorage(storageId) {
    if (!this.hasStorage(storageId)) {
      throw new Error403(this.language)
    }
  }

  /**
   * Validates if the user has access to a storage.
   */
  hasStorage(storageId: string) {
    assert(storageId, 'storageId is required')
    return this.allowedStorageIds().includes(storageId)
  }

  /**
   * Checks if the current user roles allows the permission.
   */
  hasRolePermission(permission) {
    return this.currentUserRolesIds.some((role) => {
      if (!permission.allowedRoles.some((allowedRole) => allowedRole === role)) {
        // First, make sure the role is even allowed
        return false
      }
      if (role !== roles.projectAdmin) {
        // Second, if the role is not project admin, we don't have to do extra checks
        return true
      }

      // Third, for project admin, we need to check if the user is admin of all segments
      return this.currentSegments.every((segment) =>
        this.adminSegments.includes(segment.projectGroupId),
      )
    })
  }

  /**
   * Checks if the current company plan allows the permission.
   */
  hasPlanPermission(permission) {
    assert(permission, 'permission is required')

    return permission.allowedPlans.includes(this.currentTenantPlan)
  }

  get isEmailVerified() {
    // Only checks if the email is verified
    // if the email system is on
    if (!EmailSender.isConfigured) {
      return true
    }

    return this.currentUser.emailVerified
  }

  /**
   * Returns the Current User Roles.
   */
  get currentUserRolesIds() {
    if (!this.currentUser || !this.currentUser.tenants) {
      return []
    }

    const tenant = this.currentUser.tenants
      .filter((tenantUser) => tenantUser.status === 'active')
      .find((tenantUser) => tenantUser.tenant.id === this.currentTenant.id)

    if (!tenant) {
      return []
    }

    const userRoles = tenant.roles
    if (userRoles.includes(roles.projectAdmin)) {
      return lodash.uniq(userRoles.concat(roles.readonly))
    }

    return userRoles
  }

  /**
   * Return the current tenant plan,
   * check also if it's not expired.
   */
  get currentTenantPlan() {
    if (!this.currentTenant || !this.currentTenant.plan) {
      return plans.essential
    }

    return this.currentTenant.plan
  }

  /**
   * Returns the allowed storage ids for the user.
   */
  allowedStorageIds() {
    let allowedStorageIds: Array<string> = []

    Permissions.asArray.forEach((permission) => {
      if (this.has(permission)) {
        allowedStorageIds = allowedStorageIds.concat(
          (permission.allowedStorage || []).map((storage) => storage.id),
        )
      }
    })

    return [...new Set(allowedStorageIds)]
  }
}
