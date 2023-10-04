import { Container, ContainerModule } from 'inversify'
import { ISqsClientConfig } from './types'
import { getSqsClient } from './client'
import {
  DataSinkWorkerEmitter,
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
} from './instances'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { isFlagSet } from '@crowd/common'

export const SQS_IOC = {
  config: Symbol('sqsConfig'),
  client: Symbol('sqsClient'),

  emitters: {
    integrationRunWorker: Symbol('integrationRunWorkerEmitter'),
    integrationStreamWorker: Symbol('integrationStreamWorkerEmitter'),
    integrationDataWorker: Symbol('integrationDataWorkerEmitter'),
    dataSinkWorker: Symbol('dataSinkWorkerEmitter'),
    searchSyncWorker: Symbol('searchSyncWorkerEmitter'),
    integrationSyncWorker: Symbol('integrationSyncWorkerEmitter'),
    nodejsWorker: Symbol('nodejsWorkerEmitter'),
  },
}

export enum Emitters {
  INTEGRATION_RUN_WORKER = 1 << 0,
  INTEGRATION_STREAM_WORKER = 1 << 1,
  INTEGRATION_DATA_WORKER = 1 << 2,
  DATA_SINK_WORKER = 1 << 3,
  SEARCH_SYNC_WORKER = 1 << 4,
  INTEGRATION_SYNC_WORKER = 1 << 5,
  NODEJS_WORKER = 1 << 6,

  ALL_EMITTERS = 0b11111111,
}

export const SQS_IOC_MODULE = async (
  ioc: Container,
  config: ISqsClientConfig,
  loadEmittersFlag?: number,
): Promise<ContainerModule> => {
  const sqsClient = getSqsClient(config)

  let runWorker: IntegrationRunWorkerEmitter | undefined
  let streamWorker: IntegrationStreamWorkerEmitter | undefined
  let dataWorker: IntegrationDataWorkerEmitter | undefined
  let dataSinkWorker: DataSinkWorkerEmitter | undefined
  let searchSyncWorker: SearchSyncWorkerEmitter | undefined
  let syncWorker: IntegrationSyncWorkerEmitter | undefined
  let nodejsWorker: NodejsWorkerEmitter | undefined
  if (loadEmittersFlag !== undefined) {
    const log = ioc.get<Logger>(LOGGING_IOC.logger)

    if (isFlagSet(loadEmittersFlag, Emitters.INTEGRATION_RUN_WORKER)) {
      runWorker = new IntegrationRunWorkerEmitter(sqsClient, log)
      await runWorker.init()
    }

    if (isFlagSet(loadEmittersFlag, Emitters.INTEGRATION_DATA_WORKER)) {
      dataWorker = new IntegrationDataWorkerEmitter(sqsClient, log)
      await dataWorker.init()
    }

    if (isFlagSet(loadEmittersFlag, Emitters.INTEGRATION_STREAM_WORKER)) {
      streamWorker = new IntegrationStreamWorkerEmitter(sqsClient, log)
      await streamWorker.init()
    }

    if (isFlagSet(loadEmittersFlag, Emitters.DATA_SINK_WORKER)) {
      dataSinkWorker = new DataSinkWorkerEmitter(sqsClient, log)
      await dataSinkWorker.init()
    }

    if (isFlagSet(loadEmittersFlag, Emitters.SEARCH_SYNC_WORKER)) {
      searchSyncWorker = new SearchSyncWorkerEmitter(sqsClient, log)
      await searchSyncWorker.init()
    }

    if (isFlagSet(loadEmittersFlag, Emitters.INTEGRATION_SYNC_WORKER)) {
      syncWorker = new IntegrationSyncWorkerEmitter(sqsClient, log)
      await syncWorker.init()
    }

    if (isFlagSet(loadEmittersFlag, Emitters.NODEJS_WORKER)) {
      nodejsWorker = new NodejsWorkerEmitter(sqsClient, log)
      await nodejsWorker.init()
    }
  }

  return new ContainerModule((bind) => {
    bind(SQS_IOC.config).toConstantValue(config)
    bind(SQS_IOC.client).toConstantValue(sqsClient)

    if (runWorker) {
      bind(SQS_IOC.emitters.integrationRunWorker).toConstantValue(runWorker)
    }

    if (streamWorker) {
      bind(SQS_IOC.emitters.integrationStreamWorker).toConstantValue(streamWorker)
    }

    if (dataWorker) {
      bind(SQS_IOC.emitters.integrationDataWorker).toConstantValue(dataWorker)
    }

    if (dataSinkWorker) {
      bind(SQS_IOC.emitters.dataSinkWorker).toConstantValue(dataSinkWorker)
    }

    if (searchSyncWorker) {
      bind(SQS_IOC.emitters.searchSyncWorker).toConstantValue(searchSyncWorker)
    }

    if (syncWorker) {
      bind(SQS_IOC.emitters.integrationSyncWorker).toConstantValue(syncWorker)
    }

    if (nodejsWorker) {
      bind(SQS_IOC.emitters.nodejsWorker).toConstantValue(nodejsWorker)
    }
  })
}
