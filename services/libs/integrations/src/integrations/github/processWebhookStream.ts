import { ProcessWebhookStreamHandler } from '../../types'
import { default as oldHandler } from '../github-old/processWebhookStream'

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  await oldHandler(ctx)
}

export default handler
