import { IServiceOptions } from './IServiceOptions'
import { LoggingBase } from './loggingBase'
// import Plans from '../security/plans'
import { DEFAULT_GUIDES, QuickstartGuideType } from '../types/quickstartGuideTypes'
import IntegrationRepository from '../database/repositories/integrationRepository'
import MemberService from './memberService'


export default class QuickstartGuideService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  // TODO: 
  // 1) For non-growth users, eagle eye guide shouldn't be returning
  // 2) Implement report viewed field, and add to here
  // 3) Transform array to a non-keyed normal array?
  // 
  async find() {
    const guides = DEFAULT_GUIDES

    const integrationCount = await IntegrationRepository.count({}, this.options)

    const ms = new MemberService(this.options)

    const enrichedMembers = await ms.findAndCountAll({ filter: { lastEnriched: { 'ne': null } }, limit: 1 })

    guides[QuickstartGuideType.CONNECT_INTEGRATION].completed = integrationCount > 1
    guides[QuickstartGuideType.ENRICH_MEMBER].completed = enrichedMembers.count > 0
    guides[QuickstartGuideType.SET_EAGLE_EYE].completed = this.options.currentUser.eagleEyeSettings.onboarded

    return guides
    // guides[QuickstartGuideType.INVITE_COLLEAGUES].completed = this.options.currentTenant.

    const integrationGuide = {
      name: ''
    }

  }


}
