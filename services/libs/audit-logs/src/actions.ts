import {
  ActionType,
  AuditLogAction,
  EntityType,
} from '@crowd/data-access-layer/src/audit_logs/repo'
import { diff } from 'deep-object-diff'

export type CaptureValueFn = (value: object) => void

export type CaptureFn<T> = (
  captureOldState: CaptureValueFn,
  captureNewState: CaptureValueFn,
) => Promise<T>

export type BuildActionFn<T> = () => Promise<{
  result: T
  auditLog: AuditLogAction
  error?: Error
}>

function createCaptureFn(): { value: object; fn: CaptureValueFn } {
  const result = {
    value: {},
    fn: null,
  }

  result.fn = (newValue: object) => {
    result.value = newValue
  }

  return result
}

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
