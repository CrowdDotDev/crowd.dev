/**
 * This script is responsible for regenerating
 * sourceIds for twitter follow activities that have timestamp > 1970-01-01
 */

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { getServiceLogger } from '@crowd/logging'
import { PlatformType } from '@crowd/types'
import ActivityService from '../../services/activityService'
import IntegrationService from '../../services/integrationService'
import TenantService from '../../services/tenantService'
import getUserContext from '../utils/getUserContext'
import { IntegrationServiceBase } from '../../serverless/integrations/services/integrationServiceBase'

const path = require('path')

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../.env.staging`),
})

dotenvExpand.expand(env)

const log = getServiceLogger()

async function twitterFollowsFixSourceIdsWithTimestamp() {
  const tenants = await TenantService._findAndCountAllForEveryUser({})

  // for each tenant
  for (const t of tenants.rows) {
    const tenantId = t.id
    // get user context
    const userContext = await getUserContext(tenantId)
    const integrationService = new IntegrationService(userContext)

    const twitterIntegration = (
      await integrationService.findAndCountAll({ filter: { platform: PlatformType.TWITTER } })
    ).rows[0]

    if (twitterIntegration) {
      const actService = new ActivityService(userContext)

      // get activities where timestamp != 1970-01-01, we can query by > 2000-01-01
      const activities = await actService.findAndCountAll({
        filter: { type: 'follow', timestampRange: ['2000-01-01'] },
      })

      for (const activity of activities.rows) {
        log.info({ activity }, 'Activity')
        // calculate sourceId with fixed timestamps
        const sourceIdRegenerated = IntegrationServiceBase.generateSourceIdHash(
          activity.communityMember.username.twitter,
          'follow',
          '1970-01-01T00:00:00+00:00',
          'twitter',
        )
        await actService.update(activity.id, { sourceId: sourceIdRegenerated })
      }
    }
  }
}

twitterFollowsFixSourceIdsWithTimestamp()
