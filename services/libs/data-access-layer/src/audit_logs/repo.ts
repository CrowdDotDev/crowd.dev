import validator from 'validator'

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
  error?: object
}

export enum EntityType {
  MEMBER = 'member',
  ORGANIZATION = 'organization',
  INTEGRATION = 'integration',
}

export enum ActionType {
  MEMBERS_MERGE = 'members-merge',
  MEMBERS_UNMERGE = 'members-unmerge',
  MEMBERS_EDIT_IDENTITIES = 'members-edit-identities',
  MEMBERS_EDIT_ORGANIZATIONS = 'members-edit-organizations',
  MEMBERS_EDIT_MANUAL_AFFILIATION = 'members-edit-manual-affiliation',
  MEMBERS_EDIT_PROFILE = 'members-edit-profile',
  MEMBERS_CREATE = 'members-create',
  ORGANIZATIONS_MERGE = 'organizations-merge',
  ORGANIZATIONS_UNMERGE = 'organizations-unmerge',
  ORGANIZATIONS_EDIT_IDENTITIES = 'organizations-edit-identities',
  ORGANIZATIONS_EDIT_PROFILE = 'organizations-edit-profile',
  ORGANIZATIONS_CREATE = 'organizations-create',
  INTEGRATIONS_CONNECT = 'integrations-connect',
  INTEGRATIONS_RECONNECT = 'integrations-reconnect',
}

const ACTION_TYPES_ENTITY_TYPES = {
  [ActionType.MEMBERS_MERGE]: EntityType.MEMBER,
  [ActionType.MEMBERS_UNMERGE]: EntityType.MEMBER,
  [ActionType.MEMBERS_EDIT_IDENTITIES]: EntityType.MEMBER,
  [ActionType.MEMBERS_EDIT_ORGANIZATIONS]: EntityType.MEMBER,
  [ActionType.MEMBERS_EDIT_MANUAL_AFFILIATION]: EntityType.MEMBER,
  [ActionType.MEMBERS_EDIT_PROFILE]: EntityType.MEMBER,
  [ActionType.MEMBERS_CREATE]: EntityType.MEMBER,
  [ActionType.ORGANIZATIONS_MERGE]: EntityType.ORGANIZATION,
  [ActionType.ORGANIZATIONS_UNMERGE]: EntityType.ORGANIZATION,
  [ActionType.ORGANIZATIONS_EDIT_IDENTITIES]: EntityType.ORGANIZATION,
  [ActionType.ORGANIZATIONS_EDIT_PROFILE]: EntityType.ORGANIZATION,
  [ActionType.ORGANIZATIONS_CREATE]: EntityType.ORGANIZATION,
  [ActionType.INTEGRATIONS_CONNECT]: EntityType.INTEGRATION,
  [ActionType.INTEGRATIONS_RECONNECT]: EntityType.INTEGRATION,
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
        "diff",
        "error"
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
        $(diff),
        $(error)
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
      error: action.error ? JSON.stringify(action.error) : null,
    },
  )
}

export async function queryAuditLogs(qx: QueryExecutor, { limit, offset, filter }) {
  let actionType: string[] = undefined
  let where = ''

  if (filter?.entityId) {
    if (!validator.isUUID(filter?.entityId)) {
      return []
    }
    where += ` AND a."entityId" = $(entityId)`
  }

  if (filter?.userId) {
    if (!validator.isUUID(filter?.userId)) {
      return []
    }
    where += ` AND a."userId" = $(userId)`
  }

  if (filter?.actionType || filter?.not?.actionType) {
    const condition = filter.not ? 'NOT IN' : 'IN'
    where += ` AND a."actionType" ${condition} ($(actionType:csv))`
    actionType = filter.not ? filter.not.actionType.in : filter.actionType.in
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
      actionType,
    },
  )

  return result.map((row) => {
    row.entityType = ACTION_TYPES_ENTITY_TYPES[row.actionType]
    return row
  })
}
