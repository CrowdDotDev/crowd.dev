import {
  addAuditAction,
  AuditLogAction,
  AuditLogRequestOptions,
} from '@crowd/data-access-layer/src/audit_logs/repo'
import { BuildActionFn } from './baseActions'
import { getDbConnection } from '@crowd/data-access-layer/src/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertRepositoryOptions(options: any): AuditLogRequestOptions {
  return {
    userId: options.currentUser?.id,
    ipAddress: options.userData?.ip,
    userAgent: options.userData?.userAgent,
    requestId: options.requestId,
  }
}

async function captureChange(
  options: AuditLogRequestOptions,
  action: AuditLogAction,
  skipAuditLog: boolean,
): Promise<void> {
  if (skipAuditLog) {
    return
  }

  if (action.success && (!action.diff || JSON.stringify(action.diff) === '{}')) {
    // we ignore empty diffs but only if the action was successful
    // because when the action fails, the diff will be empty, but we need to log it
    return
  }

  const db = await getDbConnection({
    host: process.env.CROWD_DB_WRITE_HOST,
    port: parseInt(process.env.CROWD_DB_PORT),
    database: process.env.CROWD_DB_DATABASE,
    user: process.env.CROWD_DB_USERNAME,
    password: process.env.CROWD_DB_PASSWORD,
  })
  await addAuditAction(db, options, action)
}

export async function captureApiChange<T>(
  options: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  buildActionFn: BuildActionFn<T>,
  skipAuditLog = false,
): Promise<T> {
  const auditOptions = convertRepositoryOptions(options)

  const buildActionResult = await buildActionFn()
  try {
    await captureChange(auditOptions, buildActionResult.auditLog, skipAuditLog)
  } catch (error) {
    throw new Error(`Error capturing change: ${error.message}`)
  }

  if (buildActionResult.error) {
    throw buildActionResult.error
  }

  return buildActionResult.result
}
