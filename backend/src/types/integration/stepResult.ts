import { IRepositoryOptions } from '../../database/repositories/IRepositoryOptions'
import { IServiceOptions } from '../../services/IServiceOptions'

export interface IIntegrationStream {
  value: string
  metadata?: any
}

export interface IStreamResultOperation {
  type: string
  records: any[]
}

export interface IProcessStreamResults {
  operations: IStreamResultOperation[]
  lastRecord?: any
  lastRecordTimestamp?: number
  newStreams?: IIntegrationStream[]
  retry?: boolean
  sleep?: number
}

export interface IStepContext {
  startTimestamp: number
  limitCount: number
  onboarding: boolean
  pipelineData: any
  integration?: any
  microservice?: any
  repoContext: IRepositoryOptions
  serviceContext: IServiceOptions
}
