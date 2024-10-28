import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { IMemberIdentity } from '@crowd/types'

import * as activities from '../../activities'
import { IFindAndSaveGithubIdentitySourceIdsArgs } from '../../sources/lfid/types'

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

  // This will contain all promises for the identity processing
  const identityPromises = identities.map((identity) => processIdentity(identity))

  // Wait for all identity processes to complete
  await Promise.all(identityPromises)

  // Continue as new with the information from the last processed identity
  afterId = identities[identities.length - 1].memberId
  afterUsername = identities[identities.length - 1].value

  await continueAsNew<typeof findAndSaveGithubSourceIds>({
    afterId,
    afterUsername,
  })
}

//helper function to process a single identity
async function processIdentity(identity: IMemberIdentity): Promise<void> {
  const sourceId = await findGithubSourceId(identity.value)
  if (sourceId) {
    await updateIdentitySourceId(identity, sourceId)
  }
}
