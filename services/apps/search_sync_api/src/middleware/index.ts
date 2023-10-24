import { Request } from 'express'
import { ILoggingRequest } from './logging'
import { IDatabaseRequest } from './database'
import { IOpenSearchRequest } from './opensearch'
import { IRedisRequest } from './redis'

export interface ApiRequest
  extends Request,
    ILoggingRequest,
    IOpenSearchRequest,
    IRedisRequest,
    IDatabaseRequest {}
