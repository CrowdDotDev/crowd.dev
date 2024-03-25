import {
  executeChild,
  ParentClosePolicy,
  ChildWorkflowCancellationType,
  continueAsNew,
  proxyActivities,
} from '@temporalio/workflow'
import { IFindAndSaveGithubIdentitySourceIdsArgs } from '../../types/lfid-enrichment'

import * as activities from '../../activities'

const {
  getGithubIdentitiesWithoutSourceId,
  checkTokens,
  findGithubSourceId,
  updateIdentitySourceId,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function findAndSaveGithubSourceIds(
  args: IFindAndSaveGithubIdentitySourceIdsArgs,
): Promise<void> {
  const PROCESS_GITHUB_IDENTITY_PER_RUN = 10
  let afterId = args?.afterId || null
  let afterUsername = args?.afterUsername || null

  // check tokens to see if we have any resource left to use
  const hasUseableTokens = await checkTokens()

  if (!hasUseableTokens) {
    throw new Error(`Token rotator used all token credits, will be retried after some time.`)
  }

  // get github identities without source id
  const identities = await getGithubIdentitiesWithoutSourceId(
    PROCESS_GITHUB_IDENTITY_PER_RUN,
    afterId,
    afterUsername,
  )

  if (identities.length === 0) {
    return
  }

  for (const identity of identities) {
    // find source id
    const sourceId = await findGithubSourceId(identity.username)
    if (sourceId) {
      await updateIdentitySourceId(identity, sourceId)
    }

    afterId = identity.memberId
    afterUsername = identity.username
  }

  await continueAsNew<typeof findAndSaveGithubSourceIds>({
    afterId,
    afterUsername,
  })
}
