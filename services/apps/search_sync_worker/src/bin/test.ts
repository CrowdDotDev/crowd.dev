import { timeout } from '@crowd/common'
import { getOpensearchClient } from '@crowd/opensearch'
import { OPENSEARCH_CONFIG } from '../conf'

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())

  while (true) {
    console.log('pinging opensearch')
    try {
      const res = await osClient.ping()
      console.log('success', res.body)
    } catch (err) {
      console.error(err)
    }

    await timeout(5000)
  }
})
