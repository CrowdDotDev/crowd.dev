import { IntegrationState, IntegrationStreamType } from './enums/integrations'
import { BaseError } from './errors'

export interface IIntegrationStream {
  identifier: string
  type: IntegrationStreamType
  data?: unknown
}

export interface IIntegration {
  id: string
  identifier: string
  platform: string
  status: IntegrationState
  settings: unknown
}

export class RateLimitError extends BaseError {
  public rateLimitResetSeconds: number

  constructor(rateLimitResetSeconds: number, endpoint: string, origError?: any) {
    super(`Endpoint: '${endpoint}' rate limit exceeded`, origError)
    this.rateLimitResetSeconds = rateLimitResetSeconds
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}
