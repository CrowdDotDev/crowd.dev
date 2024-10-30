export enum LfPermission {
  // Tenant
  tenantEdit = 'tenantEdit',
  tenantDestroy = 'tenantDestroy',

  // Plans
  planEdit = 'planEdit',
  planRead = 'planRead',

  // User
  userEdit = 'userEdit',
  userDestroy = 'userDestroy',
  userCreate = 'userCreate',
  userImport = 'userImport',
  userRead = 'userRead',
  userAutocomplete = 'userAutocomplete',

  // Audit logs
  auditLogRead = 'auditLogRead',

  // Settings
  settingsRead = 'settingsRead',
  settingsEdit = 'settingsEdit',

  // Integrations
  integrationImport = 'integrationImport',
  integrationCreate = 'integrationCreate',
  integrationEdit = 'integrationEdit',
  integrationDestroy = 'integrationDestroy',
  integrationRead = 'integrationRead',
  integrationAutocomplete = 'integrationAutocomplete',

  // Members
  memberImport = 'memberImport',
  memberCreate = 'memberCreate',
  memberEdit = 'memberEdit',
  memberDestroy = 'memberDestroy',
  memberRead = 'memberRead',
  memberAutocomplete = 'memberAutocomplete',
  mergeMembers = 'mergeMembers',

  // Tags
  tagRead = 'tagRead',
  tagImport = 'tagImport',
  tagAutocomplete = 'tagAutocomplete',
  tagCreate = 'tagCreate',
  tagEdit = 'tagEdit',
  tagDestroy = 'tagDestroy',

  // Organizations
  organizationImport = 'organizationImport',
  organizationCreate = 'organizationCreate',
  organizationEdit = 'organizationEdit',
  organizationDestroy = 'organizationDestroy',
  organizationRead = 'organizationRead',
  organizationAutocomplete = 'organizationAutocomplete',
  mergeOrganizations = 'mergeOrganizations',

  // Activities
  activityImport = 'activityImport',
  activityCreate = 'activityCreate',
  activityEdit = 'activityEdit',
  activityDestroy = 'activityDestroy',
  activityRead = 'activityRead',
  activityAutocomplete = 'activityAutocomplete',

  // Conversations
  conversationImport = 'conversationImport',
  conversationCreate = 'conversationCreate',
  conversationEdit = 'conversationEdit',
  conversationDestroy = 'conversationDestroy',
  conversationRead = 'conversationRead',
  conversationCustomize = 'conversationCustomize',
  conversationAutocomplete = 'conversationAutocomplete',

  // Eagle eye
  eagleEyeRead = 'eagleEyeRead',
  eagleEyeCreate = 'eagleEyeCreate',
  eagleEyeEdit = 'eagleEyeEdit',
  eagleEyeActionCreate = 'eagleEyeActionCreate',

  // Automations
  automationImport = 'automationImport',
  automationCreate = 'automationCreate',
  automationEdit = 'automationEdit',
  automationDestroy = 'automationDestroy',
  automationRead = 'automationRead',
  automationCustomize = 'automationCustomize',
  automationAutocomplete = 'automationAutocomplete',

  // Notes
  noteCreate = 'noteCreate',
  noteEdit = 'noteEdit',
  noteDestroy = 'noteDestroy',

  // Project groups
  projectGroupCreate = 'projectGroupCreate',
  projectGroupEdit = 'projectGroupEdit',
  projectCreate = 'projectCreate',
  projectEdit = 'projectEdit',
  subProjectCreate = 'subProjectCreate',
  subProjectEdit = 'subProjectEdit',

  // Custom views
  customViewsCreate = 'customViewsCreate',
  customViewsTenantManage = 'customViewsTenantManage',

  // Custom views
  dataQualityRead = 'dataQualityRead',
  dataQualityEdit = 'dataQualityEdit',
}
