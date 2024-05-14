import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const projectAdmin: Record<LfPermission, boolean> = {
  [LfPermission.tenantEdit]: true,
  [LfPermission.tenantDestroy]: true,
  [LfPermission.planEdit]: true,
  [LfPermission.planRead]: true,
  [LfPermission.userEdit]: true,
  [LfPermission.userDestroy]: true,
  [LfPermission.userCreate]: true,
  [LfPermission.userImport]: true,
  [LfPermission.userRead]: true,
  [LfPermission.userAutocomplete]: true,
  [LfPermission.auditLogRead]: true,
  [LfPermission.settingsRead]: true,
  [LfPermission.settingsEdit]: true,
  [LfPermission.integrationImport]: true,
  [LfPermission.integrationCreate]: true,
  [LfPermission.integrationEdit]: true,
  [LfPermission.integrationDestroy]: true,
  [LfPermission.integrationRead]: true,
  [LfPermission.integrationAutocomplete]: true,
  [LfPermission.reportImport]: true,
  [LfPermission.reportCreate]: true,
  [LfPermission.reportEdit]: true,
  [LfPermission.reportDestroy]: true,
  [LfPermission.reportRead]: true,
  [LfPermission.reportAutocomplete]: true,
  [LfPermission.memberImport]: true,
  [LfPermission.memberCreate]: true,
  [LfPermission.memberEdit]: true,
  [LfPermission.memberDestroy]: true,
  [LfPermission.memberRead]: true,
  [LfPermission.memberAutocomplete]: true,
  [LfPermission.tagRead]: true,
  [LfPermission.tagImport]: true,
  [LfPermission.tagAutocomplete]: true,
  [LfPermission.tagCreate]: true,
  [LfPermission.tagEdit]: true,
  [LfPermission.tagDestroy]: true,
  [LfPermission.organizationImport]: true,
  [LfPermission.organizationCreate]: true,
  [LfPermission.organizationEdit]: true,
  [LfPermission.organizationDestroy]: true,
  [LfPermission.organizationRead]: true,
  [LfPermission.organizationAutocomplete]: true,
  [LfPermission.activityImport]: true,
  [LfPermission.activityCreate]: true,
  [LfPermission.activityEdit]: true,
  [LfPermission.activityDestroy]: true,
  [LfPermission.activityRead]: true,
  [LfPermission.activityAutocomplete]: true,
  [LfPermission.conversationImport]: true,
  [LfPermission.conversationCreate]: true,
  [LfPermission.conversationEdit]: true,
  [LfPermission.conversationDestroy]: true,
  [LfPermission.conversationRead]: true,
  [LfPermission.conversationCustomize]: true,
  [LfPermission.conversationAutocomplete]: true,
  [LfPermission.eagleEyeRead]: true,
  [LfPermission.eagleEyeCreate]: true,
  [LfPermission.eagleEyeEdit]: true,
  [LfPermission.eagleEyeActionCreate]: true,
  [LfPermission.automationImport]: true,
  [LfPermission.automationCreate]: true,
  [LfPermission.automationEdit]: true,
  [LfPermission.automationDestroy]: true,
  [LfPermission.automationRead]: true,
  [LfPermission.automationCustomize]: true,
  [LfPermission.automationAutocomplete]: true,
  [LfPermission.noteCreate]: true,
  [LfPermission.noteEdit]: true,
  [LfPermission.noteDestroy]: true,
  [LfPermission.projectGroupCreate]: false,
  [LfPermission.projectGroupEdit]: true,
  [LfPermission.projectCreate]: true,
  [LfPermission.projectEdit]: true,
  [LfPermission.subProjectCreate]: true,
  [LfPermission.subProjectEdit]: true,
  [LfPermission.mergeMembers]: true,
  [LfPermission.mergeOrganizations]: true,
  [LfPermission.customViewsCreate]: true,
  [LfPermission.customViewsTenantManage]: true,
};

export default projectAdmin;
