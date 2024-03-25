import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../activities'

const { refreshToken, get, getLFIDEnrichableMembers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function lfid(): Promise<void> {
  const token = await refreshToken()
  const members = await getLFIDEnrichableMembers(10, 0)

  console.log('Members: ')
  console.log(members)

  for (const member of members) {
    const x = await get(token, member)
  }

  // await get(token)
}
