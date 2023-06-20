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
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      settingsEdit: {
        id: 'settingsEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      memberAttributesRead: {
        id: 'memberAttributesRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberAttributesEdit: {
        id: 'memberAttributesEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberAttributesDestroy: {
        id: 'memberAttributesDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberAttributesCreate: {
        id: 'memberAttributesCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberImport: {
        id: 'memberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      memberCreate: {
        id: 'memberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberEdit: {
        id: 'memberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberDestroy: {
        id: 'memberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      memberRead: {
        id: 'memberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      memberAutocomplete: {
        id: 'memberAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      automationUpdate: {
        id: 'automationUpdate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      tagImport: {
        id: 'tagImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      tagCreate: {
        id: 'tagCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      tagEdit: {
        id: 'tagEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      tagDestroy: {
        id: 'tagDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      tagRead: {
        id: 'tagRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      tagAutocomplete: {
        id: 'tagAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      organizationImport: {
        id: 'organizationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      organizationCreate: {
        id: 'organizationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      organizationEdit: {
        id: 'organizationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      organizationDestroy: {
        id: 'organizationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      organizationRead: {
        id: 'organizationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      organizationAutocomplete: {
        id: 'organizationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      widgetImport: {
        id: 'widgetImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      widgetCreate: {
        id: 'widgetCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      widgetEdit: {
        id: 'widgetEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      widgetDestroy: {
        id: 'widgetDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      widgetRead: {
        id: 'widgetRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      widgetAutocomplete: {
        id: 'widgetAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      integrationImport: {
        id: 'integrationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      integrationControlLimit: {
        id: 'integrationControlLimit',
        allowedRoles: [],
        allowedPlans: [],
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      microserviceImport: {
        id: 'microserviceImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      microserviceCreate: {
        id: 'microserviceCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      microserviceEdit: {
        id: 'microserviceEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      microserviceDestroy: {
        id: 'microserviceDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      microserviceRead: {
        id: 'microserviceRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      microserviceAutocomplete: {
        id: 'microserviceAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      microserviceVariantFree: {
        id: 'microserviceVariantFree',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      microserviceVariantPremium: {
        id: 'microserviceVariantPremium',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth, plans.eagleEye, plans.enterprise],
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      eagleEyeActionCreate: {
        id: 'eagleEyeActionCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise],
      },
      eagleEyeActionDestroy: {
        id: 'eagleEyeActionDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise],
      },
      eagleEyeContentCreate: {
        id: 'eagleEyeContentCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise],
      },
      eagleEyeContentRead: {
        id: 'eagleEyeContentRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise],
      },
      eagleEyeContentSearch: {
        id: 'eagleEyeContentSearch',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise],
      },
      eagleEyeContentEdit: {
        id: 'eagleEyeContentEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise],
      },
      taskImport: {
        id: 'taskImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      taskCreate: {
        id: 'taskCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      taskEdit: {
        id: 'taskEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      taskDestroy: {
        id: 'taskDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      taskRead: {
        id: 'taskRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      taskAutocomplete: {
        id: 'taskAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      taskBatch: {
        id: 'taskBatch',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      noteImport: {
        id: 'noteImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      noteCreate: {
        id: 'noteCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      noteEdit: {
        id: 'noteEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      noteDestroy: {
        id: 'noteDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
        allowedStorage: [],
      },
      noteRead: {
        id: 'noteRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      noteAutocomplete: {
        id: 'noteAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      quickstartGuideRead: {
        id: 'quickstartGuideRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      quickstartGuideSettingsUpdate: {
        id: 'quickstartGuideSettingsUpdate',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
    }
  }

  static get asArray() {
    return Object.keys(this.values).map((value) => this.values[value])
  }
}

export default Permissions
