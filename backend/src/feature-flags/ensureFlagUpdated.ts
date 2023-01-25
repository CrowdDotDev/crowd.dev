import { PostHog } from 'posthog-node'
import Plans from '../security/plans'
import { FeatureFlag } from '../types/common'
import { getServiceLogger } from '../utils/logging'
import { timeout } from '../utils/timing'

const log = getServiceLogger()

export const PLAN_LIMITS = {
  [Plans.values.essential]: {
    [FeatureFlag.AUTOMATIONS]: 2,
    [FeatureFlag.CSV_EXPORT]: 2,
    [FeatureFlag.MEMBER_ENRICHMENT]: 5,
  },
  [Plans.values.growth]: {
    [FeatureFlag.AUTOMATIONS]: 10,
    [FeatureFlag.CSV_EXPORT]: 10,
    [FeatureFlag.MEMBER_ENRICHMENT]: 1000,
  },
}
export default async (
  featureFlag: FeatureFlag,
  tenantId: string,
  posthog: PostHog,
  payload: any,
): Promise<void> => {
  let expectedFlag = true

  switch (featureFlag) {
    case FeatureFlag.AUTOMATIONS: {
      expectedFlag =
        (payload.plan === Plans.values.growth &&
          payload.automationCount < PLAN_LIMITS[Plans.values.growth][FeatureFlag.AUTOMATIONS]) ||
        (payload.plan === Plans.values.essential &&
          payload.automationCount < PLAN_LIMITS[Plans.values.essential][FeatureFlag.AUTOMATIONS])
      break
    }
    case FeatureFlag.CSV_EXPORT: {
      expectedFlag =
        (payload.plan === Plans.values.growth &&
          payload.csvExportCount < PLAN_LIMITS[Plans.values.growth][FeatureFlag.CSV_EXPORT]) ||
        (payload.plan === Plans.values.essential &&
          payload.csvExportCount < PLAN_LIMITS[Plans.values.essential][FeatureFlag.CSV_EXPORT])
      break
    }
    case FeatureFlag.MEMBER_ENRICHMENT: {
      expectedFlag =
        (payload.plan === Plans.values.growth &&
          payload.memberEnrichmentCount <
            PLAN_LIMITS[Plans.values.growth][FeatureFlag.MEMBER_ENRICHMENT]) ||
        (payload.plan === Plans.values.essential &&
          payload.memberEnrichmentCount <
            PLAN_LIMITS[Plans.values.essential][FeatureFlag.MEMBER_ENRICHMENT])
      break
    }
    case FeatureFlag.EAGLE_EYE:
    case FeatureFlag.ORGANIZATIONS:
    case FeatureFlag.COMMUNITY_HELP_CENTER_PRO: {
      expectedFlag = payload.plan === Plans.values.growth
      break
    }
    default:
      log.error(featureFlag, 'Unsupported feature flag.')
      return
  }

  let featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
    groups: { tenant: tenantId },
  })

  let tries = 0
  const MAX_TRY_COUNT = 10

  while (expectedFlag !== featureFlagEnabled && tries < MAX_TRY_COUNT) {
    await timeout(500)
    featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
      groups: { tenant: tenantId },
    })

    tries += 1
    if (tries === 5) {
      log.info(`Tried ${MAX_TRY_COUNT} times to sync the flags without luck... Breaking`)
    }
  }

  log.info(`Feature flag ${featureFlag} is ensured!`)
}
