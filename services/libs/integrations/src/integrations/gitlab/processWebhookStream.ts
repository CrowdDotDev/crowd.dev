import {
  IProcessWebhookStreamContext,
  ProcessWebhookStreamHandler,
  IProcessStreamContext,
} from '../../types'

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  const identifier = ctx.stream.identifier
  const webhookCreatedAt = ctx.stream.webhookCreatedAt
}

export default handler
