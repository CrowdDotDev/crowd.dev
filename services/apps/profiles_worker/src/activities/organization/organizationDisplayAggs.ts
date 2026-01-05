import { getSystemSettingValue, setSystemSettingValue } from '@crowd/data-access-layer'
import { fetchOrganizationDisplayAggregates } from '@crowd/data-access-layer/src/activityRelations'
import { updateOrganizationDisplayAggregates } from '@crowd/data-access-layer/src/organizations/segments'
import { IOrganizationDisplayAggregates } from '@crowd/data-access-layer/src/organizations/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../../main'

export async function getOrganizationDisplayAggsLastSyncedAt(): Promise<string> {
  const qx = pgpQx(svc.postgres.reader.connection())
  const setting = await getSystemSettingValue(qx, 'organizationDisplayAggsLastSyncedAt')

  if (!setting) {
    throw new Error('Organization display aggs last sync at setting not found!')
  }

  return setting.timestamp
}

export async function touchOrganizationDisplayAggsLastSyncedAt(): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  await setSystemSettingValue(qx, 'organizationDisplayAggsLastSyncedAt', {
    timestamp: new Date().toISOString(),
  })
}

export async function getOrganizationDisplayAggregates(
  organizationId: string,
): Promise<IOrganizationDisplayAggregates[]> {
  return fetchOrganizationDisplayAggregates(pgpQx(svc.postgres.reader.connection()), organizationId)
}

export async function setOrganizationDisplayAggregates(
  data: IOrganizationDisplayAggregates[],
): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  await updateOrganizationDisplayAggregates(qx, data)
}
