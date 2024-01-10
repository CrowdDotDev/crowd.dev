import lodash from 'lodash'
import { LoggerBase } from '@crowd/logging'
import { IServiceOptions } from './IServiceOptions'
import {
  DEFAULT_GUIDES,
  QuickstartGuideMap,
  QuickstartGuideSettings,
  QuickstartGuideType,
} from '../types/quickstartGuideTypes'
import IntegrationRepository from '../database/repositories/integrationRepository'
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
    const guides: QuickstartGuideMap = JSON.parse(JSON.stringify(DEFAULT_GUIDES))

    if (QuickstartGuideType.VIEW_REPORT in guides) {
      const viewedReports = await ReportRepository.findAndCountAll(
        { advancedFilter: { viewedBy: { contains: [this.options.currentUser.id] } } },
        this.options,
      )
      guides[QuickstartGuideType.VIEW_REPORT].completed = viewedReports.count > 0
    }
    if (QuickstartGuideType.INVITE_COLLEAGUES in guides) {
      const allTenantUsers = await TenantUserRepository.findByTenant(
        this.options.currentTenant.id,
        this.options,
      )
      guides[QuickstartGuideType.INVITE_COLLEAGUES].completed = allTenantUsers.some(
        (tu) => tu.invitedById === this.options.currentUser.id,
      )
    }

    if (QuickstartGuideType.CONNECT_FIRST_INTEGRATION in guides) {
      const integrationCount: number = await IntegrationRepository.count({}, this.options)
      guides[QuickstartGuideType.CONNECT_FIRST_INTEGRATION].completed = integrationCount > 0
    }

    if (QuickstartGuideType.CREATE_AUTOMATIONS in guides) {
      const automations = await new AutomationRepository(this.options).findAndCountAll({})
      guides[QuickstartGuideType.CREATE_AUTOMATIONS].completed = automations.count > 0
    }

    if (
      QuickstartGuideType.EXPLORE_ORGANIZATIONS in guides ||
      QuickstartGuideType.EXPLORE_CONTACTS in guides
    ) {
      const tenantSettings = await SettingsRepository.getTenantSettings(
        this.options.currentTenant.id,
        this.options,
      )
      if (QuickstartGuideType.EXPLORE_ORGANIZATIONS in guides) {
        guides[QuickstartGuideType.EXPLORE_ORGANIZATIONS].completed =
          tenantSettings.organizationsViewed
      }

      if (QuickstartGuideType.EXPLORE_CONTACTS in guides) {
        guides[QuickstartGuideType.EXPLORE_CONTACTS].completed = tenantSettings.contactsViewed
      }
    }

    return guides
  }
}
