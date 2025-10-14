import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import {
  OrganizationField,
  fetchOrganizationsForEnrichment,
  findOrgById,
} from '@crowd/data-access-layer'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getChildLogger } from '@crowd/logging'
import {
  IEnrichableOrganization,
  IEnrichmentSourceQueryInput,
  OrganizationEnrichmentSource,
} from '@crowd/types'

import { OrganizationEnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'

export async function getEnrichableOrganizations(
  limit: number,
  sources: OrganizationEnrichmentSource[],
): Promise<IEnrichableOrganization[]> {
  const sourceInputs: IEnrichmentSourceQueryInput<OrganizationEnrichmentSource>[] = sources.map(
    (s) => {
      const srv = OrganizationEnrichmentSourceServiceFactory.getEnrichmentSourceService(s, svc.log)
      return {
        source: s,
        cacheObsoleteAfterSeconds: srv.cacheObsoleteAfterSeconds,
        enrichableBySql: srv.enrichableBySql,
      }
    },
  )

  const qx = dbStoreQx(svc.postgres.reader)

  return fetchOrganizationsForEnrichment(qx, limit, sourceInputs)
}

export async function findOrganizationById(organizationId: string): Promise<boolean> {
  const qx = dbStoreQx(svc.postgres.reader)
  const organization = await findOrgById(qx, organizationId, [OrganizationField.ID])
  return !!organization
}

let searchSyncWorkerEmitter: SearchSyncWorkerEmitter | undefined
async function getSearchSyncWorkerEmitter(): Promise<SearchSyncWorkerEmitter> {
  if (searchSyncWorkerEmitter) {
    if (!searchSyncWorkerEmitter.isInitialized()) {
      await searchSyncWorkerEmitter.init()
    }

    return searchSyncWorkerEmitter
  }

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(svc.queue, svc.log)

  await searchSyncWorkerEmitter.init()

  return searchSyncWorkerEmitter
}

export async function syncToOpensearch(organizationId: string): Promise<void> {
  const log = getChildLogger(syncToOpensearch.name, svc.log, {
    organizationId,
  })

  try {
    const searchSyncWorkerEmitter = await getSearchSyncWorkerEmitter()
    await searchSyncWorkerEmitter.triggerOrganizationSync(organizationId, false)
  } catch (err) {
    log.error(err, 'Error while syncing organization to OpenSearch!')
    throw new Error(err)
  }

  return null
}
