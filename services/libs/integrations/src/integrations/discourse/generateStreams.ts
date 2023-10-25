// generateStreams.ts content
import { GenerateStreamsHandler } from '../../types'
import { DiscourseStreamType, DiscourseCategoryStreamData } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  await ctx.publishStream<DiscourseCategoryStreamData>(DiscourseStreamType.CATEGORIES, {
    page: '',
  })
}

export default handler
