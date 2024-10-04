import { Request } from 'express'
import { ILoggingRequest } from './logging'
import { IDatabaseRequest } from './database'
import { IQueueRequest } from './queue'
import { IEmittersRequest } from './emitters'

export interface ApiRequest
  extends Request,
    ILoggingRequest,
    IDatabaseRequest,
    IQueueRequest,
    IEmittersRequest {}
