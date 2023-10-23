import { ProcessStreamHandler } from '../../types'
import { TwitterStreamType } from './types'

const processMentionsStream: ProcessStreamHandler = async (ctx) => {}

const processHashtagStream: ProcessStreamHandler = async (ctx) => {}

const handler: ProcessStreamHandler = async (ctx) => {
  const streamIdentifier = ctx.stream.identifier.split(':')

  switch (streamIdentifier[0]) {
    case TwitterStreamType.MENTIONS:
      await processMentionsStream(ctx)
      break
    case TwitterStreamType.HASHTAG:
      await processHashtagStream(ctx)
      break
    default:
      throw new Error(`Unknown stream identifier: ${ctx.stream.identifier}`)
  }
}

export default handler
