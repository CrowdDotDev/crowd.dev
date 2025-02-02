import { timeout } from '@crowd/common'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'example',
  cronTime: '* * * * *',
  timeout: 120,
  process: async (ctx) => {
    ctx.log.info('Running inside a job!')
    await timeout(62 * 1000)
  },
}

export default job
