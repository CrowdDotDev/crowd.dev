import moment from 'moment'
import { PostHog } from 'posthog-node'
import { API_CONFIG, POSTHOG_CONFIG } from '../config'
import AutomationRepository from '../database/repositories/automationRepository'
import { Edition } from '../types/common'
import { RedisCache, RedisClient } from '../utils/redis'

export default async function setPosthogTenantProperties(
  tenant: any,
  posthog: PostHog,
  database: any,
  redis: RedisClient,
) {
  if (POSTHOG_CONFIG.apiKey && API_CONFIG.edition === Edition.CROWD_HOSTED) {
    const automationCount = await AutomationRepository.countAll(database, tenant.id)
    const csvExportCountCache = new RedisCache('csvExportCount', redis)

    let csvExportCount = await csvExportCountCache.getValue(tenant.id)
    const endTime = moment().endOf('month')
    const startTime = moment()

    const secondsRemainingUntilEndOfMonth = endTime.diff(startTime, 'days') * 86400

    if (!csvExportCount) {
      await csvExportCountCache.setValue(tenant.id, '0', secondsRemainingUntilEndOfMonth)
      csvExportCount = '0'
    }

    const payload = {
      groupType: 'tenant',
      groupKey: tenant.id,
      properties: {
        name: tenant.name,
        plan: tenant.plan,
        automationCount: automationCount.toString(),
        csvExportCount,
      },
    }

    console.log(payload)
    posthog.groupIdentify(payload)
    posthog.flush()
  }
}
