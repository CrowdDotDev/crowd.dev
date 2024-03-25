import { IMember } from '@crowd/types'
import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../../activities'

const { refreshToken, get } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '2 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
})

export async function enrichMemberWithLFAuth0(member: IMember): Promise<void> {
  const token = await refreshToken()
  const mem = await get(token, member)

  if (mem) {
    console.log('Found some member: ')
    console.log(mem)
  }
}
