import type { Request } from 'express'

/**
 * Auth-method-agnostic caller identity. Every auth strategy
 * (bearer token, API key, user OAuth) resolves to this interface.
 * Route handlers only interact with ApiCaller — never raw tokens.
 */
export interface ApiCaller {
  type: 'machine' | 'user'
  id: string
  scopes: string[]
}

export interface ApiRequest extends Request {
  caller: ApiCaller   // short, clear
}

export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_SCOPE = 'INSUFFICIENT_SCOPE',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const ERROR_CODE_TO_STATUS: Record<ApiErrorCode, number> = {
    [ApiErrorCode.UNAUTHORIZED]: 401,
    [ApiErrorCode.FORBIDDEN]: 403,
    [ApiErrorCode.INSUFFICIENT_SCOPE]: 403,
    [ApiErrorCode.NOT_FOUND]: 404,
    [ApiErrorCode.CONFLICT]: 409,
    [ApiErrorCode.VALIDATION_ERROR]: 400,
    [ApiErrorCode.INTERNAL_ERROR]: 500,
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode

  public readonly status: number

  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = ERROR_CODE_TO_STATUS[code]
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    }
  }
}
