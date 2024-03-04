import { DbConnection } from '@crowd/database'

export interface AuditLogRequestOptions {
  userId: string
  ipAddress: string
  userAgent: string
  requestId: string
}

export interface AuditLogAction {
  actionType: ActionType
  success: boolean
  entityId: string
  oldState: object
  newState: object
  diff: object
}

export enum ActionType {
  MEMBERS_MERGE = 'members-merge',
  MEMBERS_EDIT_IDENTITIES = 'members-edit-identities',
  MEMBERS_EDIT_ORGANIZATIONS = 'members-edit-organizations',
  MEMBERS_EDIT_MANUAL_AFFILIATION = 'members-edit-manual-affiliation',
  MEMBERS_EDIT_PROFILE = 'members-edit-profile',
  MEMBERS_CREATE = 'members-create',
  ORGANIZATIONS_MERGE = 'organizations-merge',
  ORGANIZATIONS_EDIT_IDENTITIES = 'organizations-edit-identities',
  ORGANIZATIONS_EDIT_PROFILE = 'organizations-edit-profile',
  ORGANIZATIONS_CREATE = 'organizations-create',
  INTEGRATIONS_CONNECT = 'integrations-connect',
  INTEGRATIONS_RECONNECT = 'integrations-reconnect',
}

export async function addAuditAction(
  db: DbConnection,
  options: AuditLogRequestOptions,
  action: AuditLogAction,
) {
  await db.query(
    `
      INSERT INTO "auditLogAction" (
        "userId",
        "ipAddress",
        "userAgent",
        "requestId",
        "actionType",
        success,
        "entityId",
        "oldState",
        "newState",
        "diff"
      )
      VALUES (
        $(userId),
        $(ipAddress),
        $(userAgent),
        $(requestId),
        $(actionType),
        $(success),
        $(entityId),
        $(oldState),
        $(newState),
        $(diff)
      )
    `,
    {
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      requestId: options.requestId,
      actionType: action.actionType,
      success: action.success,
      entityId: action.entityId,
      oldState: JSON.stringify(action.oldState),
      newState: JSON.stringify(action.newState),
      diff: JSON.stringify(action.diff),
    },
  )
}
