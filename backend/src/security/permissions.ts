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
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      settingsEdit: {
        id: 'settingsEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      memberAttributesRead: {
        id: 'memberAttributesRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberAttributesEdit: {
        id: 'memberAttributesEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberAttributesDestroy: {
        id: 'memberAttributesDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberAttributesCreate: {
        id: 'memberAttributesCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberImport: {
        id: 'memberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      memberCreate: {
        id: 'memberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberEdit: {
        id: 'memberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberDestroy: {
        id: 'memberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      memberRead: {
        id: 'memberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      memberAutocomplete: {
        id: 'memberAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      automationUpdate: {
        id: 'automationUpdate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      tagImport: {
        id: 'tagImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      tagCreate: {
        id: 'tagCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      tagEdit: {
        id: 'tagEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      tagDestroy: {
        id: 'tagDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      tagRead: {
        id: 'tagRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      tagAutocomplete: {
        id: 'tagAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      organizationImport: {
        id: 'organizationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      organizationCreate: {
        id: 'organizationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      organizationEdit: {
        id: 'organizationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      organizationDestroy: {
        id: 'organizationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      organizationRead: {
        id: 'organizationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      organizationAutocomplete: {
        id: 'organizationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      widgetImport: {
        id: 'widgetImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      widgetCreate: {
        id: 'widgetCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      widgetEdit: {
        id: 'widgetEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      widgetDestroy: {
        id: 'widgetDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      widgetRead: {
        id: 'widgetRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      widgetAutocomplete: {
        id: 'widgetAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      integrationImport: {
        id: 'integrationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      integrationControlLimit: {
        id: 'integrationControlLimit',
        allowedRoles: [],
        allowedPlans: [],
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      microserviceImport: {
        id: 'microserviceImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      microserviceCreate: {
        id: 'microserviceCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      microserviceEdit: {
        id: 'microserviceEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      microserviceDestroy: {
        id: 'microserviceDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      microserviceRead: {
        id: 'microserviceRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      microserviceAutocomplete: {
        id: 'microserviceAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      microserviceVariantFree: {
        id: 'microserviceVariantFree',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      microserviceVariantPremium: {
        id: 'microserviceVariantPremium',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth, plans.eagleEye],
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      eagleEyeActionCreate: {
        id: 'eagleEyeActionCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye],
      },
      eagleEyeActionDestroy: {
        id: 'eagleEyeActionDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye],
      },
      eagleEyeContentCreate: {
        id: 'eagleEyeContentCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye],
      },
      eagleEyeContentRead: {
        id: 'eagleEyeContentRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye],
      },
      eagleEyeContentSearch: {
        id: 'eagleEyeContentSearch',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye],
      },
      eagleEyeContentEdit: {
        id: 'eagleEyeContentEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye],
      },
      taskImport: {
        id: 'taskImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      taskCreate: {
        id: 'taskCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      taskEdit: {
        id: 'taskEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      taskDestroy: {
        id: 'taskDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      taskRead: {
        id: 'taskRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      taskAutocomplete: {
        id: 'taskAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      taskBatch: {
        id: 'taskBatch',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      noteImport: {
        id: 'noteImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      noteCreate: {
        id: 'noteCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      noteEdit: {
        id: 'noteEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      noteDestroy: {
        id: 'noteDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
        allowedStorage: [],
      },
      noteRead: {
        id: 'noteRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      noteAutocomplete: {
        id: 'noteAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      quickstartGuideRead: {
        id: 'quickstartGuideRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      quickstartGuideSettingsUpdate: {
        id: 'quickstartGuideSettingsUpdate',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye],
      },
      segmentRead: {
        id: 'segmentRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      segmentCreate: {
        id: 'segmentCreate',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise],
      },
      segmentEdit: {
        id: 'segmentEdit',
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
