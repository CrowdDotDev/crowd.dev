import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  SearchSyncWorkerEmitter,
  SqsClient,
  getSqsClient,
} from '@crowd/sqs'
import { getServiceChildLogger } from '@crowd/logging'
import { SQS_CONFIG } from '../conf'

const log = getServiceChildLogger('service.sqs')

let sqsClient: SqsClient
const getClient = (): SqsClient => {
  if (sqsClient) return sqsClient

  const config = SQS_CONFIG
  sqsClient = getSqsClient({
    region: config.aws.region,
    host: config.host,
    port: config.port,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  })

  return sqsClient
}

let runWorkerEmitter: IntegrationRunWorkerEmitter
export const getIntegrationRunWorkerEmitter = async (): Promise<IntegrationRunWorkerEmitter> => {
  if (runWorkerEmitter) return runWorkerEmitter

  runWorkerEmitter = new IntegrationRunWorkerEmitter(getClient(), log)
  await runWorkerEmitter.init()
  return runWorkerEmitter
}

let streamWorkerEmitter: IntegrationStreamWorkerEmitter
export const getIntegrationStreamWorkerEmitter =
  async (): Promise<IntegrationStreamWorkerEmitter> => {
    if (streamWorkerEmitter) return streamWorkerEmitter

    streamWorkerEmitter = new IntegrationStreamWorkerEmitter(getClient(), log)
    await streamWorkerEmitter.init()
    return streamWorkerEmitter
  }

let searchSyncWorkerEmitter: SearchSyncWorkerEmitter
export const getSearchSyncWorkerEmitter = async (): Promise<SearchSyncWorkerEmitter> => {
  if (searchSyncWorkerEmitter) return searchSyncWorkerEmitter

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(getClient(), log)
  await searchSyncWorkerEmitter.init()
  return searchSyncWorkerEmitter
}
