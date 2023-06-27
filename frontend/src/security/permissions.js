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
        ],
      },
      eagleEyeRead: {
        id: 'eagleEyeRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
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
        ],
      },
      noteCreate: {
        id: 'noteCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
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
        ],
        allowedStorage: [],
      },
      projectGroupCreate: {
        id: 'projectGroupCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
      },
      projectGroupEdit: {
        id: 'projectGroupEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
      },
      projectCreate: {
        id: 'projectCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
      },
      projectEdit: {
        id: 'projectEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
      },
      subProjectCreate: {
        id: 'subProjectCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
      },
      subProjectEdit: {
        id: 'subProjectEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
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
