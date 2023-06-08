import {
  getIntegrationRunWorkerEmitter,
  getIntegrationStreamWorkerEmitter,
} from '@/serverless/utils/serviceSQS'

setImmediate(async () => {
  const intRunWorkerEmitter = await getIntegrationRunWorkerEmitter()
  const intStreamWorkerEmitter = await getIntegrationStreamWorkerEmitter()

  await intRunWorkerEmitter.checkRuns()
  await intStreamWorkerEmitter.checkStreams()
})
