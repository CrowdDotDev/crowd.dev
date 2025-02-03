import {
  findIntegrationDataForNangoWebhookProcessing,
  setNangoIntegrationCursor,
} from '@crowd/data-access-layer/src/integrations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getChildLogger } from '@crowd/logging'
import { NangoIntegration, getNangoCloudRecords, initNangoCloudClient } from '@crowd/nango'

import { svc } from '../main'
import { IProcessNangoWebhookArguments } from '../types'

export async function processNangoWebhook(args: IProcessNangoWebhookArguments) {
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

  if (records.records.length > 0) {
    logger.info(`Processing ${records.records.length} nango records!`)
    for (const record of records.records) {
      // process record
    }

    if (records.nextCursor) {
      await setNangoIntegrationCursor(
        dbStoreQx(svc.postgres.writer),
        integration.id,
        args.model,
        records.nextCursor,
      )

      // TODO trigger next page processing
      logger.info('Triggering processing of the next page of nango records!')
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
