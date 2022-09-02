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
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
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
          plans.free,
          plans.premium,
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
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },

      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },

      communityMemberImport: {
        id: 'communityMemberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      communityMemberCreate: {
        id: 'communityMemberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      communityMemberEdit: {
        id: 'communityMemberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      communityMemberDestroy: {
        id: 'communityMemberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      communityMemberRead: {
        id: 'communityMemberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      communityMemberAutocomplete: {
        id: 'communityMemberAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },

      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },

      conversationImport: {
        id: 'conversationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      conversationCustomize: {
        id: 'conversationCustomize',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.premium, plans.enterprise]
      },
      conversationAutocomplete: {
        id: 'conversationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      eagleEyeRead: {
        id: 'eagleEyeRead',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      automationImport: {
        id: 'automationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      automationEdit: {
        id: 'automationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ],
        allowedStorage: []
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [
          plans.free,
          plans.premium,
          plans.enterprise
        ]
      },
      automationCustomize: {
        id: 'automationCustomize',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.premium, plans.enterprise]
      },
      automationAutocomplete: {
        id: 'automationAutocomplete',
        allowedRoles: [roles.admin],
        allowedPlans: [
          plans.free,
          plans.premium,
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
