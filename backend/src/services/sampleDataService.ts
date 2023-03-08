// import { membersScore } from './../database/utils/keys/microserviceTypes'
import moment from 'moment'
import { IServiceOptions } from './IServiceOptions'
import ActivityService from './activityService'
import MemberService from './memberService'
import TenantService from './tenantService'
// import { PlatformType } from '../utils/platforms'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
import { CrowdMemberAttributes } from '../database/attributes/member/crowd'
import { GithubMemberAttributes } from '../database/attributes/member/github'
import { DiscordMemberAttributes } from '../database/attributes/member/discord'
import { TwitterMemberAttributes } from '../database/attributes/member/twitter'
import { DevtoMemberAttributes } from '../database/attributes/member/devto'
import { MemberAttributeName } from '../database/attributes/member/enums'
import { PlatformType } from '../types/integrationEnums'
import OrganizationService from './organizationService'
import ConversationService from './conversationService'
import { LoggingBase } from './loggingBase'
import MemberRepository from '../database/repositories/memberRepository'

export default class SampleDataService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  /**
   * Generates sample data from a json file for currentTenant
   * For imported sample activities and members attributes.sample.crowd is set to true
   * Sets currentTenant.hasSampleData to true
   * @param sampleMembersActivities members array included from json by require(json)
   *
   */
  async generateSampleData(sampleMembersActivities): Promise<void> {
    const activityService = new ActivityService(this.options)
    const tenantService = new TenantService(this.options)
    const memberAttributeSettingsService = new MemberAttributeSettingsService(this.options)
    await memberAttributeSettingsService.createPredefined(
      MemberAttributeSettingsService.pickAttributes(
        [MemberAttributeName.SAMPLE],
        CrowdMemberAttributes,
      ),
    )
    await memberAttributeSettingsService.createPredefined(GithubMemberAttributes)
    await memberAttributeSettingsService.createPredefined(DiscordMemberAttributes)
    await memberAttributeSettingsService.createPredefined(TwitterMemberAttributes)
    await memberAttributeSettingsService.createPredefined(DevtoMemberAttributes)

    // we update this field first because api runs this endpoint asynchronously
    // and frontend expects it to be true after 2 seconds
    await tenantService.update(this.options.currentTenant.id, {
      hasSampleData: true,
    })

    // 2022-03-16 is the most recent activity date in sample-data.json
    // When importing, we pad that value in days so that most recent activity.timestamp = now()
    const timestampPaddingInDays =
      moment().utc().diff(moment('2022-09-30 21:52:28').utc(), 'days') - 1
    this.log.info(`timestampPaddingInDays: ${timestampPaddingInDays}`)

    const members = sampleMembersActivities.members
    for (const conv of sampleMembersActivities.conversations) {
      for (const act of conv) {
        act.member = members.find((m) => m.displayName === act.member)
        act.member.attributes[MemberAttributeName.SAMPLE] = {
          [PlatformType.CROWD]: true,
        }
        act.timestamp = moment(act.timestamp).utc().add(timestampPaddingInDays, 'days').toDate()
        if (act.attributes === undefined) {
          act.attributes = {}
        }
        act.attributes.sample = true
        await activityService.createWithMember(act)
      }
    }
    this.log.info(`Sample data for tenant ${this.options.currentTenant.id} created succesfully.`)
  }

  /**
   * Deletes sample data
   * Sample data is defined for all members and activities where attributes.sample.crowd = true
   * Sets currentTenant.hasSampleData to false
   * Also removes settings for attributes.sample.crowd
   */
  async deleteSampleData(): Promise<void> {
    const tenantService = new TenantService(this.options)

    const tenant = await tenantService.findById(this.options.currentTenant.id)

    if (tenant.hasSampleData) {
      const memberService = new MemberService(this.options)
      const memberAttributeSettingsService = new MemberAttributeSettingsService(this.options)

      const memberIds = await MemberRepository.findSampleDataMemberIds(this.options)

      const organizationService = new OrganizationService(this.options)

      const organizationIds = (
        await organizationService.findAndCountAll({
          advancedFilter: {
            members: memberIds,
          },
        })
      ).rows.map((org) => org.id)

      await organizationService.destroyBulk(organizationIds)

      // deleting sample members should cascade to their activities as well
      await memberService.destroyBulk(memberIds)

      const conversationService = new ConversationService(this.options)
      const conversationIds = (
        await conversationService.findAndCountAll({
          advancedFilter: {
            activityCount: 0,
          },
          limit: 200,
        })
      ).rows.map((conv) => conv.id)

      await conversationService.destroyBulk(conversationIds)

      // delete attribute settings for attributes.sample.crowd as well
      const sampleAttributeSettings = (
        await memberAttributeSettingsService.findAndCountAll({
          filter: { name: MemberAttributeName.SAMPLE },
        })
      ).rows[0]
      await memberAttributeSettingsService.destroyAll([sampleAttributeSettings.id])

      await tenantService.update(this.options.currentTenant.id, {
        hasSampleData: false,
      })
    }

    this.log.info(`Sample data for tenant ${this.options.currentTenant.id} deleted succesfully.`)
  }
}
