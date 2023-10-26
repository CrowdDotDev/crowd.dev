import { Sequelize } from 'sequelize'
import lodash from 'lodash'
import { LoggerBase } from '@crowd/logging'
import { FeatureFlag } from '@crowd/types'
import { IServiceOptions } from './IServiceOptions'
import isFeatureEnabled from '../feature-flags/isFeatureEnabled'
import {
  DEFAULT_GUIDES,
  QuickstartGuideMap,
  QuickstartGuideSettings,
  QuickstartGuideType,
} from '../types/quickstartGuideTypes'
import IntegrationRepository from '../database/repositories/integrationRepository'
import MemberService from './memberService'
import TenantUserRepository from '../database/repositories/tenantUserRepository'
import ReportRepository from '../database/repositories/reportRepository'

export default class QuickstartGuideService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async updateSettings(settings: any) {
    const quickstartGuideSettings: QuickstartGuideSettings = lodash.pick(settings, [
      'isEagleEyeGuideDismissed',
      'isQuickstartGuideDismissed',
    ])

    const tenantUser = await TenantUserRepository.updateSettings(
      this.options.currentUser.id,
      quickstartGuideSettings,
      this.options,
    )

    return tenantUser
  }

  async find(): Promise<QuickstartGuideMap> {
    const guides: QuickstartGuideMap = JSON.parse(JSON.stringify(DEFAULT_GUIDES))

    const integrationCount: number = await IntegrationRepository.count({}, this.options)

    const ms = new MemberService(this.options)

    const enrichedMembers = await ms.findAndCountAll({
      advancedFilter: { enrichedBy: { contains: [this.options.currentUser.id] } },
      limit: 1,
    })

    const tenantUser = await TenantUserRepository.findByTenantAndUser(
      this.options.currentTenant.id,
      this.options.currentUser.id,
      this.options,
    )

    const allTenantUsers = await TenantUserRepository.findByTenant(
      this.options.currentTenant.id,
      this.options,
    )

    const viewedReports = await ReportRepository.findAndCountAll(
      { advancedFilter: { viewedBy: { contains: [this.options.currentUser.id] } } },
      this.options,
    )

    guides[QuickstartGuideType.CONNECT_INTEGRATION].completed = integrationCount > 1
    guides[QuickstartGuideType.ENRICH_MEMBER].completed = enrichedMembers.count > 0
    guides[QuickstartGuideType.VIEW_REPORT].completed = viewedReports.count > 0
    guides[QuickstartGuideType.INVITE_COLLEAGUES].completed = allTenantUsers.some(
      (tu) => tu.invitedById === this.options.currentUser.id,
    )

    if (await isFeatureEnabled(FeatureFlag.EAGLE_EYE, this.options)) {
      guides[QuickstartGuideType.SET_EAGLE_EYE].completed = tenantUser.settings.eagleEye.onboarded
    } else {
      delete guides[QuickstartGuideType.SET_EAGLE_EYE]
    }

    // try to find an enrichable member for button CTA of enrich member guide
    if (!guides[QuickstartGuideType.ENRICH_MEMBER].completed) {
      const enrichableMembers = await ms.findAndCountAll({
        advancedFilter: {
          and: [
            {
              or: [
                {
                  emails: {
                    ne: Sequelize.literal("'{}'"),
                  },
                },
                {
                  identities: {
                    contains: ['github'],
                  },
                },
              ],
            },
            {
              enrichedBy: {
                eq: Sequelize.literal("'{}'"),
              },
            },
          ],
        },
        limit: 1,
      })

      if (enrichableMembers.count > 0) {
        guides[
          QuickstartGuideType.ENRICH_MEMBER
        ].buttonLink = `/contacts/${enrichableMembers.rows[0].id}`
      }
    }

    return guides
  }
}
