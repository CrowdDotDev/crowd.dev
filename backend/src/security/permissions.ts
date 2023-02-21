import Roles from './roles'
import Plans from './plans'
import Storage from './storage'

const storage = Storage.values
const roles = Roles.values
const plans = Plans.values

class Permissions {
  static get values() {
    return {
      tenantEdit: {
        id: 'tenantEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      settingsEdit: {
        id: 'settingsEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      memberAttributesRead: {
        id: 'memberAttributesRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberAttributesEdit: {
        id: 'memberAttributesEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberAttributesDestroy: {
        id: 'memberAttributesDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberAttributesCreate: {
        id: 'memberAttributesCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberImport: {
        id: 'memberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      memberCreate: {
        id: 'memberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberEdit: {
        id: 'memberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberDestroy: {
        id: 'memberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      memberRead: {
        id: 'memberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      memberAutocomplete: {
        id: 'memberAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      automationUpdate: {
        id: 'automationUpdate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      tagImport: {
        id: 'tagImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      tagCreate: {
        id: 'tagCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      tagEdit: {
        id: 'tagEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      tagDestroy: {
        id: 'tagDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      tagRead: {
        id: 'tagRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      tagAutocomplete: {
        id: 'tagAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      organizationImport: {
        id: 'organizationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      organizationCreate: {
        id: 'organizationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      organizationEdit: {
        id: 'organizationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      organizationDestroy: {
        id: 'organizationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      organizationRead: {
        id: 'organizationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      organizationAutocomplete: {
        id: 'organizationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      widgetImport: {
        id: 'widgetImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      widgetCreate: {
        id: 'widgetCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      widgetEdit: {
        id: 'widgetEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      widgetDestroy: {
        id: 'widgetDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      widgetRead: {
        id: 'widgetRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      widgetAutocomplete: {
        id: 'widgetAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      integrationImport: {
        id: 'integrationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      integrationControlLimit: {
        id: 'integrationControlLimit',
        allowedRoles: [],
        allowedPlans: [],
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      microserviceImport: {
        id: 'microserviceImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      microserviceCreate: {
        id: 'microserviceCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      microserviceEdit: {
        id: 'microserviceEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      microserviceDestroy: {
        id: 'microserviceDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      microserviceRead: {
        id: 'microserviceRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      microserviceAutocomplete: {
        id: 'microserviceAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      microserviceVariantFree: {
        id: 'microserviceVariantFree',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      microserviceVariantPremium: {
        id: 'microserviceVariantPremium',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth],
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      eagleEyeActionCreate: {
        id: 'eagleEyeActionCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth],
      },
      eagleEyeActionDestroy: {
        id: 'eagleEyeActionDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth],
      },
      eagleEyeContentCreate: {
        id: 'eagleEyeContentCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth],
      },
      eagleEyeContentRead: {
        id: 'eagleEyeContentRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth],
      },
      eagleEyeContentSearch: {
        id: 'eagleEyeContentSearch',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth],
      },
      eagleEyeContentEdit: {
        id: 'eagleEyeContentEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth],
      },
      taskImport: {
        id: 'taskImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      taskCreate: {
        id: 'taskCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      taskEdit: {
        id: 'taskEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      taskDestroy: {
        id: 'taskDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      taskRead: {
        id: 'taskRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      taskAutocomplete: {
        id: 'taskAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      taskBatch: {
        id: 'taskBatch',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      noteImport: {
        id: 'noteImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
      },
      noteCreate: {
        id: 'noteCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      noteEdit: {
        id: 'noteEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      noteDestroy: {
        id: 'noteDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth],
        allowedStorage: [],
      },
      noteRead: {
        id: 'noteRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
      noteAutocomplete: {
        id: 'noteAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth],
      },
    }
  }

  static get asArray() {
    return Object.keys(this.values).map((value) => this.values[value])
  }
}

export default Permissions
