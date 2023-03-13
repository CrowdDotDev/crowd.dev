import Roles from '@/security/roles'
import Plans from '@/security/plans'
import Storage from '@/security/storage'

const storage = Storage.values
const roles = Roles.values
const plans = Plans.values

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
          plans.enterprise
        ]
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: [
          storage.settingsBackgroundImages,
          storage.settingsLogos
        ]
      },
      settingsEdit: {
        id: 'settingsEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: [
          storage.settingsBackgroundImages,
          storage.settingsLogos
        ]
      },
      integrationImport: {
        id: 'integrationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },

      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },

      memberImport: {
        id: 'memberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      memberCreate: {
        id: 'memberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      memberEdit: {
        id: 'memberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      memberDestroy: {
        id: 'memberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      memberRead: {
        id: 'memberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      memberAutocomplete: {
        id: 'memberAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },

      organizationImport: {
        id: 'organizationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      organizationCreate: {
        id: 'organizationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      organizationEdit: {
        id: 'organizationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      organizationDestroy: {
        id: 'organizationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      organizationRead: {
        id: 'organizationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      organizationAutocomplete: {
        id: 'organizationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },

      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },

      taskImport: {
        id: 'taskImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      taskCreate: {
        id: 'taskCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      taskEdit: {
        id: 'taskEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      taskDestroy: {
        id: 'taskDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      taskRead: {
        id: 'taskRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      taskAutocomplete: {
        id: 'taskAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },

      conversationImport: {
        id: 'conversationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      conversationCustomize: {
        id: 'conversationCustomize',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.enterprise]
      },
      conversationAutocomplete: {
        id: 'conversationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      eagleEyeRead: {
        id: 'eagleEyeRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      automationImport: {
        id: 'automationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      automationEdit: {
        id: 'automationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ],
        allowedStorage: []
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      },
      automationCustomize: {
        id: 'automationCustomize',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.enterprise]
      },
      automationAutocomplete: {
        id: 'automationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.essential,
          plans.eagleEye,
          plans.growth,
          plans.enterprise
        ]
      }
    }
  }

  static get asArray() {
    return Object.keys(this.values).map((value) => {
      return this.values[value]
    })
  }
}

export default Permissions
