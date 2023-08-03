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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },

      conversationImport: {
        id: 'conversationImport',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [plans.growth, plans.enterprise],
      },
      conversationAutocomplete: {
        id: 'conversationAutocomplete',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
      },
      eagleEyeContentRead: {
        id: 'eagleEyeRead',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedSampleTenant: true,
      },
      eagleEyeContentCreate: {
        id: 'eagleEyeContentCreate',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.growth,
          plans.essential,
          plans.eagleEye,
          plans.enterprise,
        ],
      },
      eagleEyeContentEdit: {
        id: 'eagleEyeContentEdit',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.growth,
          plans.essential,
          plans.eagleEye,
          plans.enterprise,
        ],
      },
      eagleEyeActionCreate: {
        id: 'eagleEyeActionCreate',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.growth,
          plans.essential,
          plans.eagleEye,
          plans.enterprise,
        ],
      },
      automationImport: {
        id: 'automationImport',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
          roles.viewer,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [plans.growth, plans.enterprise],
      },
      automationAutocomplete: {
        id: 'automationAutocomplete',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
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
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
          plans.scale,
        ],
        allowedStorage: [],
      },
      projectGroupCreate: {
        id: 'projectGroupCreate',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      projectGroupEdit: {
        id: 'projectGroupEdit',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      projectCreate: {
        id: 'projectCreate',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      projectEdit: {
        id: 'projectEdit',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      subProjectCreate: {
        id: 'subProjectCreate',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
      subProjectEdit: {
        id: 'subProjectEdit',
        allowedRoles: [
          roles.admin,
          roles.projectAdmin,
        ],
        allowedPlans: [
          plans.essential,
          plans.growth,
          plans.enterprise,
        ],
        allowedStorage: [],
        allowedSampleTenant: true,
      },
    };
  }

  static get asArray() {
    return Object.keys(this.values).map((value) => this.values[value]);
  }
}

export default Permissions;
