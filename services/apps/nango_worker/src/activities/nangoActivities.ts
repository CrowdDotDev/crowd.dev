import {
  findIntegrationDataForNangoWebhookProcessing,
  setNangoIntegrationCursor,
} from '@crowd/data-access-layer/src/integrations'
import IntegrationStreamRepository from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.repo'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getChildLogger } from '@crowd/logging'
import { NangoIntegration, getNangoCloudRecords, initNangoCloudClient } from '@crowd/nango'

import { svc } from '../main'
import { IProcessNangoWebhookArguments } from '../types'

export async function processNangoWebhook(
  args: IProcessNangoWebhookArguments,
): Promise<string | undefined> {
  const logger = getChildLogger(processNangoWebhook.name, svc.log, {
    provider: args.providerConfigKey,
    connectionId: args.connectionId,
    model: args.model,
  })

  initNangoCloudClient()

  const integration = await findIntegrationDataForNangoWebhookProcessing(
    dbStoreQx(svc.postgres.reader),
    args.connectionId,
  )

  if (!integration) {
    throw new Error(`Integration not found for connectionId: ${args.connectionId}`)
  }

  const cursor = integration.settings.cursors ? integration.settings.cursors[args.model] : undefined

  const records = await getNangoCloudRecords(
    args.providerConfigKey as NangoIntegration,
    args.connectionId,
    args.model,
    cursor,
  )

  const repo = new IntegrationStreamRepository(svc.postgres.writer, logger)

  if (records.records.length > 0) {
    logger.info(`Processing ${records.records.length} nango records!`)
    for (const record of records.records) {
      // process record
      const resultId = await repo.publishExternalResult(integration.id, record.activity)
      await svc.dataSinkWorkerEmitter.triggerResultProcessing(
        resultId,
        resultId,
        args.syncType === 'INITIAL',
      )
    }

    if (records.nextCursor) {
      await setNangoIntegrationCursor(
        dbStoreQx(svc.postgres.writer),
        integration.id,
        args.model,
        records.nextCursor,
      )

      return records.nextCursor
    } else {
      await setNangoIntegrationCursor(
        dbStoreQx(svc.postgres.writer),
        integration.id,
        args.model,
        records.records[records.records.length - 1].metadata.cursor,
      )
    }
  }
}
