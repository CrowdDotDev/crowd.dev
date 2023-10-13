import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  SearchSyncWorkerEmitter,
  SqsClient,
  getSqsClient,
} from '@crowd/sqs'
import { getServiceChildLogger } from '@crowd/logging'
import { getServiceTracer } from '@crowd/tracing'
import { SQS_CONFIG } from '../../conf'

const tracer = getServiceTracer()
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

  runWorkerEmitter = new IntegrationRunWorkerEmitter(getClient(), tracer, log)
  await runWorkerEmitter.init()
  return runWorkerEmitter
}

let streamWorkerEmitter: IntegrationStreamWorkerEmitter
export const getIntegrationStreamWorkerEmitter =
  async (): Promise<IntegrationStreamWorkerEmitter> => {
    if (streamWorkerEmitter) return streamWorkerEmitter

    streamWorkerEmitter = new IntegrationStreamWorkerEmitter(getClient(), tracer, log)
    await streamWorkerEmitter.init()
    return streamWorkerEmitter
  }

let searchSyncWorkerEmitter: SearchSyncWorkerEmitter
export const getSearchSyncWorkerEmitter = async (): Promise<SearchSyncWorkerEmitter> => {
  if (searchSyncWorkerEmitter) return searchSyncWorkerEmitter

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(getClient(), tracer, log)
  await searchSyncWorkerEmitter.init()
  return searchSyncWorkerEmitter
}

let integrationSyncWorkerEmitter: IntegrationSyncWorkerEmitter
export const getIntegrationSyncWorkerEmitter = async (): Promise<IntegrationSyncWorkerEmitter> => {
  if (integrationSyncWorkerEmitter) return integrationSyncWorkerEmitter

  integrationSyncWorkerEmitter = new IntegrationSyncWorkerEmitter(getClient(), tracer, log)
  await integrationSyncWorkerEmitter.init()
  return integrationSyncWorkerEmitter
}
