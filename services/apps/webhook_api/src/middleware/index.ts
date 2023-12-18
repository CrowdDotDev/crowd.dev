import { Request } from 'express'
import { ILoggingRequest } from './logging'
import { IDatabaseRequest } from './database'
import { ISqsRequest } from './sqs'
import { IEmittersRequest } from './emitters'

export interface ApiRequest
  extends Request,
    ILoggingRequest,
    IDatabaseRequest,
    ISqsRequest,
    IEmittersRequest {}
