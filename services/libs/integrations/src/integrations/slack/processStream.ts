import { ProcessStreamHandler } from '@/types'
import { SlackStreamType } from './types'

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(SlackStreamType.ROOT)) {
    //
  } else if (ctx.stream.identifier.startsWith(SlackStreamType.CHANNEL)) {
    //
    //
  } else if (ctx.stream.identifier.startsWith(SlackStreamType.MEMBERS)) {
    //
  } else if (ctx.stream.identifier.startsWith(SlackStreamType.THREADS)) {
    //
  } else {
    await ctx.abortRunWithError(`Unknown stream type: ${ctx.stream.identifier}`)
  }
}

export default handler
