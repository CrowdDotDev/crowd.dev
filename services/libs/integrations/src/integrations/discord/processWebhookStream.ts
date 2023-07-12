import { ProcessWebhookStreamHandler } from '@/types'
import { DiscordStreamType } from './types'

const handler: ProcessWebhookStreamHandler = async (ctx) => {
  const identifier = ctx.stream.identifier

  if (identifier.startsWith('github')) {
    // todo
  }
}

export default handler
