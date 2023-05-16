import { ProcessStreamHandler } from '../../../types'

const handler: ProcessStreamHandler = async (ctx) => {
  ctx.log.info('Processing stream!')
}

export default handler
