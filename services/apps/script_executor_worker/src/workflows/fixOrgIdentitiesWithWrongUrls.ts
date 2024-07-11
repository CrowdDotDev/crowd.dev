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

  const organizations = await activity.getOrgIdentitiesWithInvalidUrls(
    tenantId,
    PROCESS_ORGANIZATIONS_PER_RUN,
  )

  if (!organizations.length) {
    console.log(`No organizations found with invalid urls!`)
    return
  }

  for (const org of organizations) {
    // Normalize the url and check if it already exists
    const normalizedUrl = org.value.replace(/^(?:https?:\/\/)?(?:www\.)?([^/]+)(?:\/.*)?$/, '$1')
    const existingOrg = await activity.findOrganizationIdentity(
      org.platform,
      normalizedUrl,
      org.type,
      org.verified,
      args.tenantId,
    )

    if (existingOrg) {
      // 1. Merge the organizations if they are different
      if (existingOrg.organizationId !== org.organizationId) {
        console.log(`Organization with same identity already exists!`, {
          platform: existingOrg.platform,
          type: existingOrg.type,
          verified: existingOrg.verified,
          value: existingOrg.value,
        })

        console.log(`Merging both ${org.organizationId} and ${existingOrg.organizationId}`)
        await common.mergeOrganizations(tenantId, existingOrg.organizationId, org.organizationId)
      } else if (existingOrg.organizationId === org.organizationId) {
        // 2. Simply delete the organization identity if it's the same organization
        await activity.deleteOrganizationIdentity(
          org.organizationId,
          org.platform,
          org.type,
          org.value,
          org.verified,
          tenantId,
        )
        console.log(`Deleted ${org.organizationId} organization identity with invalid url!`)
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
