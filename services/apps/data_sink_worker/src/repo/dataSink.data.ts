import { IIntegrationResult, IntegrationResultState, PlatformType } from '@crowd/types'

export interface IResultData {
  id: string
  state: IntegrationResultState
  data: IIntegrationResult

  runId: string
  streamId: string
  apiDataId: string
  integrationId: string
  platform: PlatformType
}
