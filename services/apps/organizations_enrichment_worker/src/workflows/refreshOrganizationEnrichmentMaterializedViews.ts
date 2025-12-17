import { proxyActivities } from '@temporalio/workflow'

import { OrganizationEnrichmentMaterializedView } from '@crowd/types'

import * as activities from '../activities/enrichment'

const { refreshOrganizationEnrichmentMaterializedView } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
})

export async function refreshOrganizationEnrichmentMaterializedViews(): Promise<void> {
  for (const mv of Object.values(OrganizationEnrichmentMaterializedView)) {
    await refreshOrganizationEnrichmentMaterializedView(mv)
  }
}
