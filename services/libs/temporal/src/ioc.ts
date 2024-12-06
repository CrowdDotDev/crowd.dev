import { Client } from '@temporalio/client'
import { NativeConnection, Worker, bundleWorkflowCode } from '@temporalio/worker'
import path from 'path'

import { getEnvVar } from '@crowd/common'
import { AsyncContainerModule, Container, IOC_TYPES, asyncContainerModule } from '@crowd/ioc'
import { getServiceChildLogger } from '@crowd/logging'

import { getDataConverter, getTemporalClient } from '.'

const log = getServiceChildLogger('temporal')

export const TEMPORAL_IOC_MODULE = async (
  container: Container,
  options: {
    client?: boolean
    worker?: boolean
  },
): Promise<AsyncContainerModule> => {
  return asyncContainerModule(async (bind) => {
    if (options.client) {
      const identity = container.get<string>(IOC_TYPES.SERVICE)

      const client = await getTemporalClient({
        serverUrl: getEnvVar('CROWD_TEMPORAL_SERVER_URL', true),
        namespace: getEnvVar('CROWD_TEMPORAL_NAMESPACE', true),
        identity,
        certificate: getEnvVar('CROWD_TEMPORAL_CERTIFICATE'),
        privateKey: getEnvVar('CROWD_TEMPORAL_PRIVATE_KEY'),
      })
      bind<Client>(IOC_TYPES.TEMPORAL_CLIENT).toConstantValue(client)
    }

    if (options.worker) {
      const identity = container.get<string>(IOC_TYPES.SERVICE)

      const serverUrl = getEnvVar('CROWD_TEMPORAL_SERVER_URL', true)
      const certificate = getEnvVar('CROWD_TEMPORAL_CERTIFICATE')
      const privateKey = getEnvVar('CROWD_TEMPORAL_PRIVATE_KEY')
      const namespace = getEnvVar('CROWD_TEMPORAL_NAMESPACE', true)
      const taskQueue = getEnvVar('CROWD_TEMPORAL_TASKQUEUE', true)
      const maxTaskQueueActivitiesPerSecond = getEnvVar(
        'CROWD_TEMPORAL_TASKQUEUE_CACHE_MAX_ACTIVITIES',
      )
      const maxConcurrentActivityTaskExecutions = getEnvVar(
        'CROWD_TEMPORAL_TASKQUEUE_CACHE_CONCURRENT_ACTIVITIES',
      )
      const keyId = getEnvVar('CROWD_TEMPORAL_ENCRYPTION_KEY_ID', true)

      log.info(
        {
          address: serverUrl,
          certificate: certificate ? 'yes' : 'no',
          privateKey: privateKey ? 'yes' : 'no',
        },
        'Connecting to Temporal server as a worker!',
      )

      const connection = await NativeConnection.connect({
        address: serverUrl,
        tls:
          certificate && privateKey
            ? {
                clientCertPair: {
                  crt: Buffer.from(certificate, 'base64'),
                  key: Buffer.from(privateKey, 'base64'),
                },
              }
            : undefined,
      })

      const workflowBundle = await bundleWorkflowCode({
        workflowsPath: path.resolve('./src/workflows'),
      })

      const worker = await Worker.create({
        connection,
        identity,
        namespace,
        taskQueue,
        enableSDKTracing: true,
        showStackTraceSources: true,
        workflowBundle: workflowBundle,
        activities: require(path.resolve('./src/activities')),
        dataConverter: await getDataConverter(keyId),
        maxTaskQueueActivitiesPerSecond: maxTaskQueueActivitiesPerSecond
          ? Number(maxTaskQueueActivitiesPerSecond)
          : undefined,
        maxConcurrentActivityTaskExecutions: maxConcurrentActivityTaskExecutions
          ? Number(maxConcurrentActivityTaskExecutions)
          : undefined,
      })

      bind<Worker>(IOC_TYPES.TEMPORAL_WORKER).toConstantValue(worker)
    }
  })
}
