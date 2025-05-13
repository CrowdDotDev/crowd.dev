import { getSystemSettingValue, setSystemSettingValue } from '@crowd/data-access-layer'
import { fetchOrganizationDisplayAggregates } from '@crowd/data-access-layer/src/activities'
import { updateOrganizationDisplayAggregates } from '@crowd/data-access-layer/src/organizations/segments'
import { IOrganizationDisplayAggregates } from '@crowd/data-access-layer/src/organizations/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IRecentlyIndexedEntity, IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'

import { svc } from '../../main'

export async function getOrganizationDisplayAggsLastSyncedAt(): Promise<string> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())
    const setting = await getSystemSettingValue(qx, 'organizationDisplayAggsLastSyncedAt')

    if (!setting) {
      throw new Error('Organization display aggs last sync at setting not found!')
    }

    return setting.timestamp
  } catch (error) {
    throw new Error(error)
  }
}

export async function touchOrganizationDisplayAggsLastSyncedAt(): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await setSystemSettingValue(qx, 'organizationDisplayAggsLastSyncedAt', {
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    throw new Error(error)
  }
}

export async function getOrganizationsForDisplayAggsRefresh(
  batchSize: number,
  lastSyncedAt: string,
  afterOrganizationId?: string,
): Promise<IRecentlyIndexedEntity[]> {
  try {
    const indexingRepo = new IndexingRepository(svc.postgres.reader, svc.log)
    return indexingRepo.getRecentlyIndexedEntities(
      IndexedEntityType.ORGANIZATION,
      batchSize,
      lastSyncedAt,
      afterOrganizationId,
    )
  } catch (error) {
    throw new Error(error)
  }
}

export async function getOrganizationDisplayAggregates(
  organizationId: string,
): Promise<IOrganizationDisplayAggregates[]> {
  try {
    return fetchOrganizationDisplayAggregates(svc.questdbSQL, organizationId)
  } catch (error) {
    throw new Error(error)
  }
}

export async function setOrganizationDisplayAggregates(
  data: IOrganizationDisplayAggregates[],
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await updateOrganizationDisplayAggregates(qx, data)
  } catch (error) {
    throw new Error(error)
  }
}
