import { Request } from 'express'
import { ILoggingRequest } from './logging'
import { IDatabaseRequest } from './database'
import { IOpensearchRequest } from './opensearch'
import { IRedisRequest } from './redis'

export interface ApiRequest
  extends Request,
    ILoggingRequest,
    IOpensearchRequest,
    IRedisRequest,
    IDatabaseRequest {}
