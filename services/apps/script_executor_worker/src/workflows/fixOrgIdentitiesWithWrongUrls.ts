import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/fix-organization-identities-with-wrong-urls'
import * as commonActivities from '../activities/common'
import { IFixOrgIdentitiesWithWrongUrlsArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '10 minute',
  retry: { maximumAttempts: 1, backoffCoefficient: 3 },
})

export async function fixOrgIdentitiesWithWrongUrls(
  args: IFixOrgIdentitiesWithWrongUrlsArgs,
): Promise<void> {
  const tenantId = args.tenantId
  const PROCESS_ORGANIZATIONS_PER_RUN = args.testRun ? 10 : 100

  if (args.testRun) {
    console.log(`Running in test mode with limit 10!`)
  }

  const orgIdentities = await activity.getOrgIdentitiesWithInvalidUrls(
    tenantId,
    PROCESS_ORGANIZATIONS_PER_RUN,
  )

  if (!orgIdentities.length) {
    console.log(`No organizations found with invalid urls!`)
    return
  }

  for (const org of orgIdentities) {
    // Normalize the url and check if it already exists
    const normalizedUrl = org.value.replace(/^(?:https?:\/\/)?(?:www\.)?([^/]+)(?:\/.*)?$/, '$1')
    const existingOrgIdentity = await activity.findOrganizationIdentity(
      org.platform,
      normalizedUrl,
      org.type,
      org.verified,
      args.tenantId,
    )

    if (existingOrgIdentity) {
      // 1. Merge the organizations if they are different
      if (existingOrgIdentity.organizationId !== org.organizationId) {
        console.log(
          `Merging organization ${org.organizationId} into ${existingOrgIdentity.organizationId}`,
        )
        await common.mergeOrganizations(
          tenantId,
          existingOrgIdentity.organizationId,
          org.organizationId,
        )
      } else if (existingOrgIdentity.organizationId === org.organizationId) {
        // 2. Simply delete the organization identity if it's the same organization
        await activity.deleteOrganizationIdentity(
          org.organizationId,
          org.platform,
          org.type,
          org.value,
          org.verified,
          tenantId,
        )
        console.log(`Deleted ${org.organizationId} organization identity ${org.value}!`)
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
        tenantId,
      )
    }
  }

  if (!args.testRun) {
    await continueAsNew<typeof fixOrgIdentitiesWithWrongUrls>({
      tenantId: args.tenantId,
      testRun: args.testRun,
    })
  }
}
