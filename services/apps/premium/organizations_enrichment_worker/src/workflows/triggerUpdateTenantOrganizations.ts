import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'
import * as activities from '../activities/tenantUpdate'
import { updateTenantOrganization } from './updateTenantOrganization'

const aCtx = proxyActivities<typeof activities>({
  startToCloseTimeout: '75 seconds',
})

export async function triggerUpdateTenantOrganizations(): Promise<void> {
  const tenants = await aCtx.getApplicableTenants()

  const results = await Promise.all(tenants.map((t) => aCtx.getRemainingTenantCredits(t)))

  let promises = []
  for (let i = 0; i < tenants.length; i++) {
    let remainingCredits = results[i]

    const tenant = tenants[i]
    const organizations = tenant.orgData

    if (remainingCredits > 0) {
      const groups = groupBy(organizations, (o) => o.organizationId)

      for (const organizationId of Array.from(groups.keys())) {
        let organizationCacheId: string | undefined
        let maxDate: Date | undefined
        for (const data of groups.get(organizationId)) {
          const date = new Date(data.lastEnrichedAt)
          if (maxDate === undefined || maxDate.getTime() < date.getTime()) {
            maxDate = date
            organizationCacheId = data.organizationCacheId
          }
        }

        const promise = startChild(updateTenantOrganization, {
          workflowId:
            'update-tenant-organization-with-enriched-data/' +
            tenant.id +
            '/' +
            organizationId +
            '/' +
            organizationCacheId,
          cancellationType: ChildWorkflowCancellationType.ABANDON,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
          workflowExecutionTimeout: '15 minutes',
          retry: {
            backoffCoefficient: 2,
            maximumAttempts: 10,
            initialInterval: 2 * 1000,
            maximumInterval: 30 * 1000,
          },
          args: [
            {
              tenantId: tenant.id,
              plan: tenant.plan,
              organizationId,
              organizationCacheId,
            },
          ],
          searchAttributes: {
            TenantId: [tenant.id],
          },
        })
        promises.push(promise)
        remainingCredits--

        if (remainingCredits === 0) {
          break
        }
      }

      await Promise.all(promises)
      promises = []
    }
  }
}

const groupBy = <T, K>(array: T[], selector: (obj: T) => K): Map<K, T[]> | Map<string, T[]> => {
  const isObjectKey: boolean = array.length > 0 && isObject(selector(array[0]))

  if (isObjectKey) {
    const map = new Map<string, T[]>()

    array.forEach((value) => {
      const key = JSON.stringify(selector(value))
      if (map.has(key)) {
        ;(map.get(key) as T[]).push(value)
      } else {
        map.set(key, [value])
      }
    })

    return map
  }

  const map = new Map<K, T[]>()

  array.forEach((value) => {
    const key = selector(value)
    if (map.has(key)) {
      ;(map.get(key) as T[]).push(value)
    } else {
      map.set(key, [value])
    }
  })

  return map
}

const isObject = (val: unknown): boolean => {
  return val !== null && typeof val === 'object'
}
