export interface Event {
  userId: string;
  userEmail: string;
  key: string;
  type: string;
  sessionId: string;
  properties?: Record<string, any>;
}

export enum EventType {
  PAGE = 'Page',
  FEATURE = 'Feature',
}

export enum PageEventKey {
  PROJECT_GROUPS = 'Project groups',
  OVERVIEW = 'Overview',
  MEMBERS = 'Contributors',
  ORGANIZATIONS = 'Organizations',
  ACTIVITIES = 'Activities',
  CONVERSATIONS = 'Conversations',
  COMMUNITY_LENS = 'Community gens',
  ADMIN_PANEL = 'Admin panel',
  ADMIN_PANEL_PROJECT_GROUPS = 'Admin panel project groups',
  ADMIN_PANEL_AUTOMATIONS = 'Admin panel automations',
  ADMIN_PANEL_API_KEYS = 'Admin panel api keys',
  ADMIN_PANEL_AUDIT_LOGS = 'Admin panel audit logs',
  NEW_MEMBER = 'New contributor',
  EDIT_MEMBER = 'Edit contributor',
  MEMBER_PROFILE = 'Contributor profile',
  NEW_ORGANIZATION = 'New organization',
  EDIT_ORGANIZATION = 'Edit organization',
  ORGANIZATION_PROFILE = 'Organization profile',
  ORGANIZATIONS_MERGE_SUGGESTIONS = 'Organizations merge suggestions',
  MEMBERS_MERGE_SUGGESTIONS = 'Contributors merge suggestions',
  MANAGE_PROJECTS = 'Manage projects',
  INTEGRATIONS = 'Integrations',
  DATA_QUALITY_ASSISTANT = 'Data Quality Copilot',
}

export enum FeatureEventKey {
  ADD_MEMBER = 'Add contributor',
  EDIT_MEMBER = 'Edit contributor',
  FIND_IDENTITY = 'Find identity',
  MERGE_MEMBER = 'Merge contributor',
  MARK_AS_TEAM_MEMBER = 'Mark as team contributor',
  MARK_AS_BOT = 'Mark as bot',
  DELETE_MEMBER = 'Delete contributor',
  EXPORT_MEMBERS = 'Export contributors',
  EDIT_MEMBER_TAGS = 'Edit contributor tags',
  EDIT_MEMBER_ATTRIBUTES = 'Edit contributor attributes',
  FILTER_MEMBERS = 'Filter contributors',
  ADD_CUSTOM_VIEW = 'Add custom view',
  DELETE_CUSTOM_VIEW = 'Delete custom view',
  DUPLICATE_CUSTOM_VIEW = 'Duplicate custom view',
  EDIT_CUSTOM_VIEW = 'Edit custom view',
  REORDER_CUSTOM_VIEW = 'Reorder custom view',
  SEARCH_MEMBERS = 'Search contributors',
  SORT_MEMBERS = 'Sort contributors',
  ADD_ORGANIZATION = 'Add organization',
  EDIT_ORGANIZATION = 'Edit organization',
  MERGE_ORGANIZATION = 'Merge organization',
  MARK_AS_TEAM_ORGANIZATION = 'Mark as team organization',
  DELETE_ORGANIZATION = 'Delete organization',
  EXPORT_ORGANIZATIONS = 'Export organizations',
  FILTER_ORGANIZATIONS = 'Filter organizations',
  SEARCH_ORGANIZATIONS = 'Search organizations',
  SORT_ORGANIZATIONS = 'Sort organizations',
  FILTER_ACTIVITIES = 'Filter activities',
  SEARCH_ACTIVITIES = 'Search activities',
  FILTER_CONVERSATIONS = 'Filter conversations',
  SEARCH_CONVERSATIONS = 'Search conversations',
  ADD_ACTIVITY_TYPE = 'Add activity type',
  EDIT_ACTIVITY_TYPE = 'Edit activity type',
  DELETE_ACTIVITY_TYPE = 'Delete activity type',
  ADD_ACTIVITY = 'Add activity',
  EDIT_ACTIVITY = 'Edit activity',
  DELETE_ACTIVITY = 'Delete activity',
  DELETE_CONVERSATION = 'Delete conversation',
  VIEW_CONVERSATION = 'View conversation',
  EDIT_MEMBER_IDENTITY = 'Edit contributor identity',
  EDIT_MEMBER_EMAIL = 'Edit contributor email',
  ADD_WORK_EXPERIENCE = 'Add work experience',
  EDIT_WORK_EXPERIENCE = 'Edit work experience',
  DELETE_WORK_EXPERIENCE = 'Delete work experience',
  ADD_GLOBAL_ATTRIBUTE = 'Add global attribute',
  EDIT_GLOBAL_ATTRIBUTE = 'Edit global attribute',
  DELETE_GLOBAL_ATTRIBUTE = 'Delete global attribute',
  AFFILIATE_ACTIVITY = 'Affiliate activity',
  UNMERGE_MEMBER_IDENTITY = 'Unmerge contributor identity',
  ADD_NOTE = 'Add note',
  EDIT_NOTE = 'Edit note',
  DELETE_NOTE = 'Delete note',
  MANUAL_AFFILIATE_ACTIVITY = 'Manual affiliate activity',
  EDIT_ORGANIZATION_IDENTITY = 'Edit organization identity',
  EDIT_ORGANIZATION_EMAIL_DOMAIN = 'Edit organization email domain',
  EDIT_ORGANIZATION_PHONE_NUMBER = 'Edit organization phone number',
  UNMERGE_ORGANIZATION_IDENTITY = 'Unmerge organization identity',
  FILTER_MEMBERS_MERGE_SUGGESTIONS = 'Filter contributors merge suggestions',
  SEARCH_MEMBERS_MERGE_SUGGESTIONS = 'Search contributors merge suggestions',
  SORT_MEMBERS_MERGE_SUGGESTIONS = 'Sort contributors merge suggestions',
  FILTER_ORGANIZATIONS_MERGE_SUGGESTIONS = 'Filter organizations merge suggestions',
  SEARCH_ORGANIZATIONS_MERGE_SUGGESTIONS = 'Search organizations merge suggestions',
  SORT_ORGANIZATIONS_MERGE_SUGGESTIONS = 'Sort organizations merge suggestions',
  VIEW_MEMBER_MERGE_SUGGESTION = 'View contributor merge suggestion',
  NAVIGATE_MEMBERS_MERGE_SUGGESTIONS = 'Navigate contributors merge suggestions',
  IGNORE_MEMBER_MERGE_SUGGESTION = 'Ignore contributor merge suggestion',
  VIEW_ORGANIZATION_MERGE_SUGGESTION = 'View organization merge suggestion',
  NAVIGATE_ORGANIZATIONS_MERGE_SUGGESTIONS = 'Navigate organizations merge suggestions',
  IGNORE_ORGANIZATION_MERGE_SUGGESTION = 'Ignore organization merge suggestion',
  MERGE_MEMBER_MERGE_SUGGESTION = 'Merge contributor merge suggestion',
  MERGE_ORGANIZATION_MERGE_SUGGESTION = 'Merge organization merge suggestion',
  ADD_PROJECT_GROUP = 'Add project group',
  SEARCH_PROJECT_GROUPS = 'Search project groups',
  EDIT_PROJECT_GROUP = 'Edit project group',
  ADD_PROJECT = 'Add project',
  EDIT_PROJECT = 'Edit project',
  ADD_SUB_PROJECT = 'Add sub project',
  EDIT_SUB_PROJECT = 'Edit sub project',
  CONNECT_INTEGRATION = 'Connect integration',
  DISCONNECT_INTEGRATION = 'Disconnect integration',
  EDIT_INTEGRATION_SETTINGS = 'Edit integration settings',
  SEARCH_PROJECTS = 'Search projects',
  ADD_AUTOMATION = 'Add automation',
  EDIT_AUTOMATION = 'Edit automation',
  DELETE_AUTOMATION = 'Delete automation',
  VIEW_AUTOMATION_EXECUTION = 'View automation execution',
  SORT_AUTOMATIONS = 'Sort automations',
  COPY_AUTH_TOKEN = 'Copy auth token',
  SHOW_AUTH_TOKEN = 'Show auth token',
  VIEW_AUDIT_LOG_DETAILS = 'View audit log details',
  FILTER_AUDIT_LOGS = 'Filter audit logs',
  COPY_AUDIT_LOG_JSON = 'Copy audit log JSON',
  SELECT_PROJECT_GROUP = 'Select project group',
  FILTER_DASHBOARD = 'Filter dashboard',
  COPILOT_REVIEW_PROFILE = 'Copilot review profile',
  SEARCH = 'Search',
  FILTER = 'Filter',
}
