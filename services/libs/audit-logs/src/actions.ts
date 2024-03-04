import { diff } from 'deep-object-diff'

import { ActionType } from '@crowd/data-access-layer/src/audit_logs/repo'
import { type CaptureFn, type BuildActionFn, createCaptureFn } from './baseActions'

export function memberEditProfileAction<T>(
  entityId: string,
  captureFn: CaptureFn<T>,
): BuildActionFn<T> {
  return async () => {
    const oldState = createCaptureFn()
    const newState = createCaptureFn()

    const createAuditLog = () => ({
      actionType: ActionType.MEMBERS_EDIT_PROFILE,
      entityId,
      oldState: oldState.value,
      newState: newState.value,
      diff: diff(oldState.value, newState.value),
    })

    try {
      const result = await captureFn(oldState.fn, newState.fn)
      return {
        result,
        auditLog: {
          ...createAuditLog(),
          success: true,
        },
      }
    } catch (error) {
      return {
        result: null,
        error,
        auditLog: {
          ...createAuditLog(),
          success: false,
        },
      }
    }
  }
}
