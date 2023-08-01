import axios from 'axios'
import { CROWD_ANALYTICS_CONFIG } from '@/conf'
import UserRepository from '../database/repositories/userRepository'
import TenantRepository from '../database/repositories/tenantRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'

const IS_CROWD_ANALYTICS_ENABLED = CROWD_ANALYTICS_CONFIG.isEnabled === 'true'
const CROWD_ANALYTICS_TENANT_ID = CROWD_ANALYTICS_CONFIG.tenantId
const CROWD_ANALYTICS_BASE_URL = CROWD_ANALYTICS_CONFIG.baseUrl
const CROWD_ANALYTICS_TOKEN = CROWD_ANALYTICS_CONFIG.apiToken

// createdAnAccount (boolean)

// email

// firstName

// lastName

// plan

// is_trial

// trialEndsDate

// workspace <> organization

// Workspace → organization attributes

// Name

interface CrowdAnalyticsData {
  userId: string
  tenantId: string
  event: string
  timestamp: string
  properties: any
}

export default async function addProductData(data: CrowdAnalyticsData) {
  if (!IS_CROWD_ANALYTICS_ENABLED) {
    return
  }

  if (!CROWD_ANALYTICS_TENANT_ID) {
    return
  }

  if (!CROWD_ANALYTICS_BASE_URL) {
    return
  }

  if (!CROWD_ANALYTICS_TOKEN) {
    return
  }

  try {
    const repositoryOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    const user = await UserRepository.findById(data.userId, repositoryOptions)

    const tenant = await TenantRepository.getTenantInfo(data.tenantId, repositoryOptions)

    const obj = {
      member: {
        username: {
          'crowd.dev': user.email,
        },
        emails: [user.email],
        displayName: user.fullName,
        attributes: {
          email: user.email,
          createdAnAccount: true,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: tenant.plan,
          isTrialPlan: tenant.isTrialPlan,
          trialEndsAt: tenant.trialEndsAt,
        },
      },
      type: data.event,
      timestamp: data.timestamp,
      platform: 'crowd.dev',
      sourceId: `${data.userId}-${data.timestamp}-${data.event}`,
    }
    const endpoint = `${CROWD_ANALYTICS_BASE_URL}/api/tenant/${CROWD_ANALYTICS_TENANT_ID}/activity/with-member`
    await axios.post(endpoint, obj, {
      headers: {
        Authorization: `Bearer ${CROWD_ANALYTICS_TOKEN}`,
      },
    })
  } catch (error) {
    // nothing
  }
}
