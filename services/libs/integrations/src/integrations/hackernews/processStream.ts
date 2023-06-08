import { ProcessStreamHandler } from '@/types'
import { HackerNewsStreamType, HackerNewsInitialStreamMetadata } from './types'
import getPostsByKeywords from './api/getPostsByKeywords'

const processInitialStream: ProcessStreamHandler = async (ctx) => {
  const metadata = ctx.stream.data as HackerNewsInitialStreamMetadata

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const unixTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000)
  const posts = await getPostsByKeywords(
    {
      keywords: metadata.keywords,
      after: ctx.onboarding ? 0 : unixTimestamp,
    },
    ctx,
  )

  await ctx.publishStream(HackerNewsStreamType.MAIN, {
    keywords: metadata.keywords,
    posts,
  })
}

const processMainStream: ProcessStreamHandler = async (ctx) => {}

const handler: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(HackerNewsStreamType.INITIAL)) {
    await processInitialStream(ctx)
  } else if (ctx.stream.identifier.startsWith(HackerNewsStreamType.MAIN)) {
    await processMainStream(ctx)
  } else {
    await ctx.abortRunWithError(`Unknown stream type: ${ctx.stream.identifier}`)
  }
}

export default handler
