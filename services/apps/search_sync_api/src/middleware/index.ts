import { Request } from 'express'
import { ILoggingRequest } from './logging'
import { IDatabaseRequest } from './database'

export interface ApiRequest extends Request, ILoggingRequest, IDatabaseRequest {}
