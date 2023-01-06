import { BaseError } from '../baseError'

export class NotSupportedError extends BaseError {
  public action: string

  constructor(action: string, originalError?: any) {
    super(`Action '${action}' is not supported!`, originalError)
    this.action = action
  }
}
