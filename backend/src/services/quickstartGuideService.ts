import { Sequelize } from 'sequelize'
import lodash from 'lodash'
import { LoggerBase } from '@crowd/logging'
import { FeatureFlag } from '@crowd/types'
import { IServiceOptions } from './IServiceOptions'
import isFeatureEnabled from '../feature-flags/isFeatureEnabled'
import {
  DEFAULT_GUIDES,
  DEFAULT_GUIDES_V2,
  QuickstartGuideMap,
  QuickstartGuideSettings,
  QuickstartGuideType,
} from '../types/quickstartGuideTypes'
import IntegrationRepository from '../database/repositories/integrationRepository'
import MemberService from './memberService'
import TenantUserRepository from '../database/repositories/tenantUserRepository'
import ReportRepository from '../database/repositories/reportRepository'
import AutomationRepository from '../database/repositories/automationRepository'
import SettingsRepository from '@/database/repositories/settingsRepository'

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
    const isGuidesV2Enabled = await isFeatureEnabled(FeatureFlag.QUICKSTART_V2, this.options)
    const guides: QuickstartGuideMap = JSON.parse(
      JSON.stringify(isGuidesV2Enabled ? DEFAULT_GUIDES_V2 : DEFAULT_GUIDES),
    )
    this.log.info('Integration count')
    const integrationCount: number = await IntegrationRepository.count({}, this.options)
    this.log.info('Set member service')
    const ms = new MemberService(this.options)
    this.log.info('Enriching members')
    const enrichedMembers = await ms.findAndCountAll({
      advancedFilter: { enrichedBy: { contains: [this.options.currentUser.id] } },
      limit: 1,
    })
    this.log.info('Fetching tenant user')
    const tenantUser = await TenantUserRepository.findByTenantAndUser(
      this.options.currentTenant.id,
      this.options.currentUser.id,
      this.options,
    )

    this.log.info('Find all tenant users')
    const allTenantUsers = await TenantUserRepository.findByTenant(
      this.options.currentTenant.id,
      this.options,
    )

    this.log.info('Viewed reports')
    const viewedReports = await ReportRepository.findAndCountAll(
      { advancedFilter: { viewedBy: { contains: [this.options.currentUser.id] } } },
      this.options,
    )

    this.log.info('Fetch automations')
    const automations = await new AutomationRepository(this.options).findAndCountAll({})


    this.log.info('Fetch tenant settings')
    const tenantSettings = await SettingsRepository.getTenantSettings(
      this.options.currentTenant.id,
      this.options,
    )


    this.log.info('CONNECT_INTEGRATION')
    if (QuickstartGuideType.CONNECT_INTEGRATION in guides) {
      guides[QuickstartGuideType.CONNECT_INTEGRATION].completed = integrationCount > 1
    }
    this.log.info('ENRICH_MEMBER')
    if (QuickstartGuideType.ENRICH_MEMBER in guides) {
      guides[QuickstartGuideType.ENRICH_MEMBER].completed = enrichedMembers.count > 0
    }
    this.log.info('VIEW_REPORT')
    if (QuickstartGuideType.VIEW_REPORT in guides) {
      guides[QuickstartGuideType.VIEW_REPORT].completed = viewedReports.count > 0
    }
    this.log.info('INVITE_COLLEAGUES')
    if (QuickstartGuideType.INVITE_COLLEAGUES in guides) {
      guides[QuickstartGuideType.INVITE_COLLEAGUES].completed = allTenantUsers.some(
        (tu) => tu.invitedById === this.options.currentUser.id,
      )
    }

    this.log.info('CONNECT_FIRST_INTEGRATION')
    if (QuickstartGuideType.CONNECT_FIRST_INTEGRATION in guides) {
      guides[QuickstartGuideType.CONNECT_FIRST_INTEGRATION].completed = integrationCount > 0
    }

    this.log.info('CREATE_AUTOMATIONS')
    if (QuickstartGuideType.CREATE_AUTOMATIONS in guides) {
      guides[QuickstartGuideType.CREATE_AUTOMATIONS].completed = automations.count > 0
    }

    this.log.info('EXPLORE_ORGANIZATIONS')
    if (QuickstartGuideType.EXPLORE_ORGANIZATIONS in guides) {
      guides[QuickstartGuideType.EXPLORE_ORGANIZATIONS].completed =
        tenantSettings.organizationsViewed
    }

    this.log.info('EXPLORE_CONTACTS')
    if (QuickstartGuideType.EXPLORE_CONTACTS in guides) {
      guides[QuickstartGuideType.EXPLORE_CONTACTS].completed = tenantSettings.contactsViewed
    }

    this.log.info('SET_EAGLE_EYE')
    if (
      QuickstartGuideType.SET_EAGLE_EYE in guides &&
      (await isFeatureEnabled(FeatureFlag.EAGLE_EYE, this.options))
    ) {
      guides[QuickstartGuideType.SET_EAGLE_EYE].completed = tenantUser.settings.eagleEye.onboarded
    } else {
      delete guides[QuickstartGuideType.SET_EAGLE_EYE]
    }

    this.log.info('ENRICH_MEMBER')
    // try to find an enrichable member for button CTA of enrich member guide
    if (
      QuickstartGuideType.ENRICH_MEMBER in guides &&
      !guides[QuickstartGuideType.ENRICH_MEMBER].completed
    ) {
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
