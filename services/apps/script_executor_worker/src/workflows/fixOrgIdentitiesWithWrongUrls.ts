import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as commonActivities from '../activities/common'
import * as activities from '../activities/fix-organization-identities-with-wrong-urls'
import { IScriptBatchTestArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '10 minute',
  retry: { maximumAttempts: 1, backoffCoefficient: 3 },
})

export async function fixOrgIdentitiesWithWrongUrls(args: IScriptBatchTestArgs): Promise<void> {
  const PROCESS_ORGANIZATIONS_PER_RUN = args.testRun ? 10 : 100

  if (args.testRun) {
    console.log(`Running in test mode with limit 10!`)
  }

  const orgIdentities = await activity.getOrgIdentitiesWithInvalidUrls(
    PROCESS_ORGANIZATIONS_PER_RUN,
  )

  if (!orgIdentities.length) {
    console.log(`No organizations found with invalid urls!`)
    return
  }

  for (const org of orgIdentities) {
    // Normalize the url and check if it already exists
    const normalizedUrl = org.value.replace(/^(?:https?:\/\/)?(?:www\.)?([^/]+)(?:\/.*)?$/, '$1')
    const existingOrgIdentities = await activity.findOrganizationIdentity(
      org.platform,
      normalizedUrl,
      org.type,
      org.verified,
    )

    const filteredIdentities = existingOrgIdentities.filter(
      (identity) => identity.organizationId === org.organizationId,
    )

    const existingOrgIdentity = filteredIdentities.length
      ? filteredIdentities[0]
      : existingOrgIdentities[0]

    if (existingOrgIdentity) {
      let primaryOrgId = existingOrgIdentity.organizationId
      let secondaryOrgId = org.organizationId
      // 1. Merge the organizations if they are different
      if (primaryOrgId !== secondaryOrgId) {
        const lfxMember = await activity.isLfxMember(org.organizationId)
        if (lfxMember) {
          console.log(`Secondary organization ${org.organizationId} is an LFX member!`)
          primaryOrgId = org.organizationId
          secondaryOrgId = existingOrgIdentity.organizationId
        }

        console.log(`Merging organization ${secondaryOrgId} into ${primaryOrgId}`)
        await common.mergeOrganizations(primaryOrgId, secondaryOrgId)
      } else if (primaryOrgId === secondaryOrgId) {
        // 2. Simply delete the organization identity if it's the same organization
        await activity.deleteOrganizationIdentity(
          org.organizationId,
          org.platform,
          org.type,
          org.value,
          org.verified,
        )
        console.log(`Deleted ${org.organizationId} organization identity ${org.value}`)
      }
    } else {
      // 3. Directly update the organization identity if there's no conflict
      await activity.updateOrganizationIdentity(
        org.organizationId,
        org.platform,
        normalizedUrl,
        org.value,
        org.type,
        org.verified,
      )
    }
  }

  if (!args.testRun) {
    await continueAsNew<typeof fixOrgIdentitiesWithWrongUrls>({
      testRun: args.testRun,
    })
  }
}
