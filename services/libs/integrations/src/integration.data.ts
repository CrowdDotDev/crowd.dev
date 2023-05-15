import { IIntegration, IIntegrationStream } from '@crowd/types'

export interface IGenerateStreamsContext {
  runId: string
  integration: IIntegration
  publishStream: (stream: IIntegrationStream) => Promise<void>
}

export interface IProcessStreamContext {
  runId: string
  integration: IIntegration
  stream: IIntegrationStream

  publishData: (data: unknown) => Promise<void>
  publishNextPageStream: (stream: IIntegrationStream) => Promise<void>
}
