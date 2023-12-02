import Roles from '@/security/roles';
import Plans from '@/security/plans';
import Storage from '@/security/storage';

const storage = Storage.values;
const roles = Roles.values;
const plans = Plans.values;

/**
 * This class defines all the roles/plans that have permissions to trigger
 * actions within modules (ex: memberEdit, activityCreate, conversationCreate, etc)
 */
class Permissions {
  static get values() {
    return {
      tenantEdit: {
        id: 'tenantEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [
          storage.settingsBackgroundImages,
          storage.settingsLogos,
        ],
        allowedSampleTenant: true,
      },
      settingsEdit: {
        id: 'settingsEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [
          storage.settingsBackgroundImages,
          storage.settingsLogos,
        ],
        allowedSampleTenant: true,
      },
      integrationImport: {
        id: 'integrationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },

      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },

      memberImport: {
        id: 'memberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      memberCreate: {
        id: 'memberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      memberEdit: {
        id: 'memberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      memberDestroy: {
        id: 'memberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      memberRead: {
        id: 'memberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      memberAutocomplete: {
        id: 'memberAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },

      organizationImport: {
        id: 'organizationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      organizationCreate: {
        id: 'organizationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      organizationEdit: {
        id: 'organizationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      organizationDestroy: {
        id: 'organizationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      organizationRead: {
        id: 'organizationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      organizationAutocomplete: {
        id: 'organizationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },

      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },

      taskImport: {
        id: 'taskImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      taskCreate: {
        id: 'taskCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      taskEdit: {
        id: 'taskEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      taskDestroy: {
        id: 'taskDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      taskRead: {
        id: 'taskRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      taskAutocomplete: {
        id: 'taskAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },

      conversationImport: {
        id: 'conversationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      conversationCustomize: {
        id: 'conversationCustomize',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.enterprise],
      },
      conversationAutocomplete: {
        id: 'conversationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      eagleEyeRead: {
        id: 'eagleEyeRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      automationImport: {
        id: 'automationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      automationEdit: {
        id: 'automationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      automationCustomize: {
        id: 'automationCustomize',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.enterprise],
      },
      automationAutocomplete: {
        id: 'automationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      noteCreate: {
        id: 'noteCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      noteEdit: {
        id: 'noteEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      noteDestroy: {
        id: 'noteDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
    };
  }

  static get asArray() {
    return Object.keys(this.values).map((value) => this.values[value]);
  }
}

export default Permissions;
