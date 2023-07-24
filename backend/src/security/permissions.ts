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
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      tenantDestroy: {
        id: 'tenantDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      planEdit: {
        id: 'planEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      planRead: {
        id: 'planRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      userEdit: {
        id: 'userEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      userDestroy: {
        id: 'userDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      userCreate: {
        id: 'userCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      userImport: {
        id: 'userImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      userRead: {
        id: 'userRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      userAutocomplete: {
        id: 'userAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      auditLogRead: {
        id: 'auditLogRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      settingsRead: {
        id: 'settingsRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      settingsEdit: {
        id: 'settingsEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [storage.settingsBackgroundImages, storage.settingsLogos],
      },
      memberAttributesRead: {
        id: 'memberAttributesRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberAttributesEdit: {
        id: 'memberAttributesEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberAttributesDestroy: {
        id: 'memberAttributesDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberAttributesCreate: {
        id: 'memberAttributesCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberImport: {
        id: 'memberImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      memberCreate: {
        id: 'memberCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberEdit: {
        id: 'memberEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberDestroy: {
        id: 'memberDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      memberRead: {
        id: 'memberRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      memberAutocomplete: {
        id: 'memberAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      activityImport: {
        id: 'activityImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      activityCreate: {
        id: 'activityCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      activityEdit: {
        id: 'activityEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      activityDestroy: {
        id: 'activityDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      activityRead: {
        id: 'activityRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      activityAutocomplete: {
        id: 'activityAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      automationCreate: {
        id: 'automationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      automationUpdate: {
        id: 'automationUpdate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      automationDestroy: {
        id: 'automationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      automationRead: {
        id: 'automationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      tagImport: {
        id: 'tagImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      tagCreate: {
        id: 'tagCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      tagEdit: {
        id: 'tagEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      tagDestroy: {
        id: 'tagDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      tagRead: {
        id: 'tagRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      tagAutocomplete: {
        id: 'tagAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      organizationImport: {
        id: 'organizationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      organizationCreate: {
        id: 'organizationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      organizationEdit: {
        id: 'organizationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      organizationDestroy: {
        id: 'organizationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      organizationRead: {
        id: 'organizationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      organizationAutocomplete: {
        id: 'organizationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      widgetImport: {
        id: 'widgetImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      widgetCreate: {
        id: 'widgetCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      widgetEdit: {
        id: 'widgetEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      widgetDestroy: {
        id: 'widgetDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      widgetRead: {
        id: 'widgetRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      widgetAutocomplete: {
        id: 'widgetAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      reportImport: {
        id: 'reportImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      reportCreate: {
        id: 'reportCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      reportEdit: {
        id: 'reportEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      reportDestroy: {
        id: 'reportDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      reportRead: {
        id: 'reportRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      reportAutocomplete: {
        id: 'reportAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      integrationImport: {
        id: 'integrationImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      integrationControlLimit: {
        id: 'integrationControlLimit',
        allowedRoles: [],
        allowedPlans: [],
      },
      integrationCreate: {
        id: 'integrationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      integrationEdit: {
        id: 'integrationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      integrationDestroy: {
        id: 'integrationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      integrationRead: {
        id: 'integrationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      integrationAutocomplete: {
        id: 'integrationAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      microserviceImport: {
        id: 'microserviceImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      microserviceCreate: {
        id: 'microserviceCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      microserviceEdit: {
        id: 'microserviceEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      microserviceDestroy: {
        id: 'microserviceDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      microserviceRead: {
        id: 'microserviceRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      microserviceAutocomplete: {
        id: 'microserviceAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      microserviceVariantFree: {
        id: 'microserviceVariantFree',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      microserviceVariantPremium: {
        id: 'microserviceVariantPremium',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      conversationCreate: {
        id: 'conversationCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      conversationEdit: {
        id: 'conversationEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      conversationDestroy: {
        id: 'conversationDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      conversationRead: {
        id: 'conversationRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      eagleEyeActionCreate: {
        id: 'eagleEyeActionCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise, plans.scale],
      },
      eagleEyeActionDestroy: {
        id: 'eagleEyeActionDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise, plans.scale],
      },
      eagleEyeContentCreate: {
        id: 'eagleEyeContentCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise, plans.scale],
      },
      eagleEyeContentRead: {
        id: 'eagleEyeContentRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise, plans.scale],
      },
      eagleEyeContentSearch: {
        id: 'eagleEyeContentSearch',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise, plans.scale],
      },
      eagleEyeContentEdit: {
        id: 'eagleEyeContentEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.growth, plans.essential, plans.eagleEye, plans.enterprise, plans.scale],
      },
      taskImport: {
        id: 'taskImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      taskCreate: {
        id: 'taskCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      taskEdit: {
        id: 'taskEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      taskDestroy: {
        id: 'taskDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      taskRead: {
        id: 'taskRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      taskAutocomplete: {
        id: 'taskAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      taskBatch: {
        id: 'taskBatch',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      noteImport: {
        id: 'noteImport',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      noteCreate: {
        id: 'noteCreate',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      noteEdit: {
        id: 'noteEdit',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      noteDestroy: {
        id: 'noteDestroy',
        allowedRoles: [roles.admin],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
        allowedStorage: [],
      },
      noteRead: {
        id: 'noteRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      noteAutocomplete: {
        id: 'noteAutocomplete',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      quickstartGuideRead: {
        id: 'quickstartGuideRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      quickstartGuideSettingsUpdate: {
        id: 'quickstartGuideSettingsUpdate',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      segmentRead: {
        id: 'segmentRead',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      segmentCreate: {
        id: 'segmentCreate',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
      segmentEdit: {
        id: 'segmentEdit',
        allowedRoles: [roles.admin, roles.readonly],
        allowedPlans: [plans.essential, plans.growth, plans.eagleEye, plans.enterprise, plans.scale],
      },
    }
  }

  static get asArray() {
    return Object.keys(this.values).map((value) => this.values[value])
  }
}

export default Permissions
