import { v4 as uuid } from 'uuid'
import IncomingWebhookRepository from '../database/repositories/incomingWebhookRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { getServiceLogger } from '../utils/logging'
import { WebhookType } from '../types/webhooks'

const logger = getServiceLogger()

setImmediate(async () => {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()

  const repo = new IncomingWebhookRepository(options)

  const tenantId = uuid()
  const integrationId = uuid()

  const data = await repo.create({
    type: WebhookType.GITHUB,
    tenantId,
    integrationId,
    payload: {
      test: 'test',
    },
  })

  console.log('webhook data', data)

  const existing = await repo.findById(data.id)

  console.log('existing', existing)

  await repo.markCompleted(data.id)
})
