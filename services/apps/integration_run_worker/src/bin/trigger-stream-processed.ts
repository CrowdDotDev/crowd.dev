import { IntegrationRunWorkerEmitter } from '@crowd/common_services'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: runIds')
  process.exit(1)
}

const runIds = processArguments[0].split(',')

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(queueClient, log)
  await emitter.init()

  const results = await dbConnection.any(
    `select r.id, r.onboarding, i.platform from integration.runs r
     inner join integrations i on i.id = r."integrationId"
     where r.id in ($runIds:csv)`,
    {
      runIds,
    },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const res of results as any[]) {
    await emitter.streamProcessed(res.platform, res.id, res.onboarding)
  }
})
