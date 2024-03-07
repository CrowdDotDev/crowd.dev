import { DbConnection } from '@crowd/database'
import { QueryExecutor } from '../queryExecutor'

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

export async function queryAuditLogs(qx: QueryExecutor, { limit, offset, filter }) {
  let where = ''

  if (filter?.entityId) {
    where += ` AND a."entityId" = $(entityId)`
  }

  if (filter?.userId) {
    where += ` AND a."userId" = $(userId)`
  }

  const result = await qx.select(
    `
      SELECT
        a.*,
        JSON_BUILD_OBJECT(
          'id', u.id,
          'email', u.email,
          'fullName', u."fullName"
        ) AS "user"
      FROM "auditLogAction" a
      JOIN users u ON a."userId" = u.id
      WHERE 1 = 1
        ${where}
      ORDER BY a.timestamp DESC
      LIMIT $(limit)
      OFFSET $(offset)
    `,
    {
      limit,
      offset,
      userId: filter?.userId,
      entityId: filter?.entityId,
    },
  )

  return result
}
