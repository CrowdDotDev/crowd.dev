import { IProcessStreamContext, ProcessStreamHandler } from '../../types'
import { StackOverflowRootStream } from './types'
import { IntegrationStreamType } from '@crowd/types'

const processRootStream: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(StackOverflowRootStream.QUESTIONS_BY_TAG)) {
    //
  } else if (ctx.stream.identifier.startsWith(StackOverflowRootStream.QUESTIONS_BY_KEYWORD)) {
    //
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.type === IntegrationStreamType.ROOT) {
    await processRootStream(ctx)
  } else {
    //
  }
}

export default handler
