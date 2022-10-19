import { IRepositoryOptions } from '../../database/repositories/IRepositoryOptions'
import { IServiceOptions } from '../../services/IServiceOptions'

export interface IPreprocessResult {
  processMetadata?: any
}

export interface IIntegrationStream {
  value: string
  metadata?: any
}

export interface IStreamsResult {
  processMetadata?: any
  streams: IIntegrationStream[]
}

export interface IStreamResultOperation {
  type: string
  records: any[]
}

export interface IProcessStreamResults {
  operations: IStreamResultOperation[]
  processMetadata?: any
  newStreams?: IIntegrationStream[]
  retry?: boolean
  sleep?: number
}

export interface IStepContext {
  startTimestamp: number
  limitCount: number
  integration?: any
  microservice?: any
  repoContext: IRepositoryOptions
  serviceContext: IServiceOptions
}
