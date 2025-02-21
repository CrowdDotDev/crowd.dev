import axios from 'axios'

import { getDefaultTenantId } from '@crowd/common'
import { getActivitiesSortedById } from '@crowd/data-access-layer'
import { IndexedEntityType, IndexingRepository } from '@crowd/opensearch'
import { IActivityData } from '@crowd/types'

import { svc } from '../../main'

const tenantId = getDefaultTenantId()

export async function deleteActivityIdsFromIndexedEntities(): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.deleteIndexedEntities(IndexedEntityType.ACTIVITY)
}

export async function getLatestSyncedActivityId(): Promise<string> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  return await indexingRepo.getLatestIndexedEntityId(IndexedEntityType.ACTIVITY)
}

export async function markActivitiesAsIndexedInPostgres(activityIds: string[]): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.markEntitiesIndexed(IndexedEntityType.ACTIVITY, activityIds)
}

export async function getActivitiesToCopyToTinybird(
  latestSyncedActivityId: string,
  limit: number,
): Promise<IActivityData[]> {
  const activities = await getActivitiesSortedById(svc.questdbSQL, latestSyncedActivityId, limit)
  return activities
}

export async function sendActivitiesToTinybird(activities: IActivityData[]): Promise<void> {
  let response

  try {
    const url = `https://api.tinybird.co/v0/events?name=activities`
    const config = {
      method: 'post',
      url,
      data: activities.map((a) => JSON.stringify(a)).join('\n'),
      headers: {
        Authorization: `Bearer ${process.env['CROWD_TINYBIRD_ACCESS_TOKEN']}`,
      },
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404 || status === 422
      },
    }

    response = (await axios(config)).data
    console.log(`Data sent to tinybird ->  ${JSON.stringify(response)}`)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      this.log.warn(
        `Axios error occurred while sending activities to tinybird. ${err.response?.status} - ${err.response?.statusText}`,
      )
      throw new Error(`Sending data to tinybird failed with status: ${err.response?.status}`)
    } else {
      this.log.error(`Unexpected error while sending data to tinybird: ${err}`)
      throw new Error('An unexpected error occurred')
    }
  }

  return response
}
