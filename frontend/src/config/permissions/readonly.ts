import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const readonly: Record<LfPermission, boolean> = {
  [LfPermission.tenantEdit]: false,
  [LfPermission.tenantDestroy]: false,
  [LfPermission.planEdit]: false,
  [LfPermission.planRead]: false,
  [LfPermission.userEdit]: false,
  [LfPermission.userDestroy]: false,
  [LfPermission.userCreate]: false,
  [LfPermission.userImport]: false,
  [LfPermission.userRead]: false,
  [LfPermission.userAutocomplete]: false,
  [LfPermission.auditLogRead]: false,
  [LfPermission.settingsRead]: false,
  [LfPermission.settingsEdit]: false,
  [LfPermission.integrationImport]: false,
  [LfPermission.integrationCreate]: false,
  [LfPermission.integrationEdit]: false,
  [LfPermission.integrationDestroy]: false,
  [LfPermission.integrationRead]: true,
  [LfPermission.integrationAutocomplete]: false,
  [LfPermission.memberImport]: false,
  [LfPermission.memberCreate]: false,
  [LfPermission.memberEdit]: false,
  [LfPermission.memberDestroy]: false,
  [LfPermission.memberRead]: true,
  [LfPermission.memberAutocomplete]: false,
  [LfPermission.tagRead]: true,
  [LfPermission.tagImport]: false,
  [LfPermission.tagAutocomplete]: false,
  [LfPermission.tagCreate]: false,
  [LfPermission.tagEdit]: false,
  [LfPermission.tagDestroy]: false,
  [LfPermission.organizationImport]: false,
  [LfPermission.organizationCreate]: false,
  [LfPermission.organizationEdit]: false,
  [LfPermission.organizationDestroy]: false,
  [LfPermission.organizationRead]: true,
  [LfPermission.organizationAutocomplete]: false,
  [LfPermission.activityImport]: false,
  [LfPermission.activityCreate]: false,
  [LfPermission.activityEdit]: false,
  [LfPermission.activityDestroy]: false,
  [LfPermission.activityRead]: true,
  [LfPermission.activityAutocomplete]: false,
  [LfPermission.conversationImport]: false,
  [LfPermission.conversationCreate]: false,
  [LfPermission.conversationEdit]: false,
  [LfPermission.conversationDestroy]: false,
  [LfPermission.conversationRead]: true,
  [LfPermission.conversationCustomize]: false,
  [LfPermission.conversationAutocomplete]: false,
  [LfPermission.eagleEyeRead]: true,
  [LfPermission.eagleEyeCreate]: false,
  [LfPermission.eagleEyeEdit]: false,
  [LfPermission.eagleEyeActionCreate]: false,
  [LfPermission.automationImport]: false,
  [LfPermission.automationCreate]: false,
  [LfPermission.automationEdit]: false,
  [LfPermission.automationDestroy]: false,
  [LfPermission.automationRead]: true,
  [LfPermission.automationCustomize]: false,
  [LfPermission.automationAutocomplete]: false,
  [LfPermission.projectGroupCreate]: false,
  [LfPermission.projectGroupEdit]: false,
  [LfPermission.projectCreate]: false,
  [LfPermission.projectEdit]: false,
  [LfPermission.subProjectCreate]: false,
  [LfPermission.subProjectEdit]: false,
  [LfPermission.mergeMembers]: false,
  [LfPermission.mergeOrganizations]: false,
  [LfPermission.customViewsCreate]: true,
  [LfPermission.customViewsTenantManage]: false,
  [LfPermission.dataQualityRead]: false,
  [LfPermission.dataQualityEdit]: false,
};

export default readonly;
