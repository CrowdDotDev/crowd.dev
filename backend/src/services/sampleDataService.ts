// import { membersScore } from './../database/utils/keys/microserviceTypes'
import lodash from 'lodash'
import moment from 'moment'

import {
  CROWD_MEMBER_ATTRIBUTES,
  DEVTO_MEMBER_ATTRIBUTES,
  DISCORD_MEMBER_ATTRIBUTES,
  GITHUB_MEMBER_ATTRIBUTES,
  LINKEDIN_MEMBER_ATTRIBUTES,
  TWITTER_MEMBER_ATTRIBUTES,
} from '@crowd/integrations'
import { LoggerBase } from '@crowd/logging'
import {
  MemberAttributeName,
  MemberAttributeType,
  MemberAttributes,
  PlatformType,
} from '@crowd/types'

import { API_CONFIG } from '../conf'
import MemberRepository from '../database/repositories/memberRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'
import ActivityService from './activityService'
import ConversationService from './conversationService'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
import MemberService from './memberService'
import NoteService from './noteService'
import OrganizationService from './organizationService'
import TagService from './tagService'
import TenantService from './tenantService'

export default class SampleDataService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
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
    const tenantService = new TenantService(this.options)
    await tenantService.update(this.options.currentTenant.id, {
      hasSampleData: true,
    })
    if (API_CONFIG.edition !== 'crowd-hosted') {
      try {
        const activityService = new ActivityService(this.options)
        const memberService = new MemberService(this.options)
        const tagService = new TagService(this.options)
        const noteService = new NoteService(this.options)
        const memberAttributeSettingsService = new MemberAttributeSettingsService(this.options)
        await memberAttributeSettingsService.createPredefined(
          MemberAttributeSettingsService.pickAttributes(
            [MemberAttributeName.SAMPLE],
            CROWD_MEMBER_ATTRIBUTES,
          ),
        )
        await memberAttributeSettingsService.createPredefined(GITHUB_MEMBER_ATTRIBUTES)
        await memberAttributeSettingsService.createPredefined(DISCORD_MEMBER_ATTRIBUTES)
        await memberAttributeSettingsService.createPredefined(TWITTER_MEMBER_ATTRIBUTES)
        await memberAttributeSettingsService.createPredefined(DEVTO_MEMBER_ATTRIBUTES)
        await memberAttributeSettingsService.createPredefined(LINKEDIN_MEMBER_ATTRIBUTES)

        const MemberEnrichmentAttributeSettings = [
          {
            name: MemberAttributeName.SKILLS,
            label: MemberAttributes[MemberAttributeName.SKILLS].label,
            type: MemberAttributeType.MULTI_SELECT,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.LANGUAGES,
            label: MemberAttributes[MemberAttributeName.LANGUAGES].label,
            type: MemberAttributeType.MULTI_SELECT,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.PROGRAMMING_LANGUAGES,
            label: MemberAttributes[MemberAttributeName.PROGRAMMING_LANGUAGES].label,
            type: MemberAttributeType.MULTI_SELECT,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.AWARDS,
            label: MemberAttributes[MemberAttributeName.AWARDS].label,
            type: MemberAttributeType.SPECIAL,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.SENIORITY_LEVEL,
            label: MemberAttributes[MemberAttributeName.SENIORITY_LEVEL].label,
            type: MemberAttributeType.STRING,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.EXPERTISE,
            label: MemberAttributes[MemberAttributeName.EXPERTISE].label,
            type: MemberAttributeType.MULTI_SELECT,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.COUNTRY,
            label: MemberAttributes[MemberAttributeName.COUNTRY].label,
            type: MemberAttributeType.STRING,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.YEARS_OF_EXPERIENCE,
            label: MemberAttributes[MemberAttributeName.YEARS_OF_EXPERIENCE].label,
            type: MemberAttributeType.NUMBER,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.EDUCATION,
            label: MemberAttributes[MemberAttributeName.EDUCATION].label,
            type: MemberAttributeType.SPECIAL,
            canDelete: false,
            show: true,
          },
          {
            name: MemberAttributeName.WORK_EXPERIENCES,
            label: MemberAttributes[MemberAttributeName.WORK_EXPERIENCES].label,
            type: MemberAttributeType.SPECIAL,
            canDelete: false,
            show: true,
          },
        ]

        await memberAttributeSettingsService.createPredefined(MemberEnrichmentAttributeSettings)

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

        for (const member of members) {
          const tagList = []
          const noteList = []
          for (const tag of member.tags || []) {
            const found = (await tagService.findAndCountAll({ advancedFilter: { name: tag } }))
              .rows[0]
            if (found) {
              tagList.push(found.id)
            } else {
              const createdTag = await tagService.create({
                name: tag,
                // Current date minus a random interval between 0 and 10 days
                createdAt: moment()
                  .subtract(Math.floor(Math.random() * 10), 'days')
                  .toDate(),
              })
              tagList.push(createdTag.id)
            }
          }
          member.tags = tagList

          for (const note of member.notes || []) {
            const createdNote = await noteService.create({
              body: note,
              // Current date minus a random interval between 0 and 10 days
              createdAt: moment()
                .subtract(Math.floor(Math.random() * 10), 'days')
                .toDate(),
            })
            noteList.push(createdNote.id)
          }
          member.notes = noteList

          for (const key of Object.keys(member.attributes)) {
            const attSettings = lodash.find(MemberEnrichmentAttributeSettings, {
              name: key,
            })
            if (attSettings?.type === MemberAttributeType.MULTI_SELECT) {
              const newOptions = member.attributes[key].enrichment
              const existingDbAttribute = (
                await memberAttributeSettingsService.findAndCountAll({
                  filter: { name: key },
                })
              ).rows[0]
              const existingOptions = existingDbAttribute.options
              const allOptions = lodash.union(existingOptions, newOptions)
              await memberAttributeSettingsService.update(existingDbAttribute.id, {
                options: allOptions,
              })
            }
          }
          member.contributions = member.openSourceContributions
          member.lastEnriched = new Date()
          member.platform = 'github'
          await memberService.upsert(member)
        }

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
            act.sentiment.sentiment = Math.min(act.sentiment.sentiment + 40, 100)
            await activityService.createWithMember(act)
          }
        }
        this.log.info(
          `Sample data for tenant ${this.options.currentTenant.id} created succesfully.`,
        )
      } catch (err) {
        this.log.error(err)
        throw err
      }
    }
  }

  /**
   * Deletes sample data
   * Sample data is defined for all members and activities where attributes.sample.crowd = true
   * Sets currentTenant.hasSampleData to false
   * Also removes settings for attributes.sample.crowd
   */
  async deleteSampleData(): Promise<void> {
    const tx = await SequelizeRepository.createTransaction(this.options)

    const txOptions = { ...this.options, transaction: tx }

    try {
      const tenantService = new TenantService(txOptions)

      const tenant = await tenantService.findById(this.options.currentTenant.id)

      if (tenant.hasSampleData) {
        if (API_CONFIG.edition !== 'crowd-hosted') {
          const memberService = new MemberService(txOptions)
          const memberAttributeSettingsService = new MemberAttributeSettingsService(txOptions)

          const memberIds = await MemberRepository.findSampleDataMemberIds(txOptions)

          const organizationService = new OrganizationService(txOptions)

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

          const conversationService = new ConversationService(txOptions)
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
        }

        await tenantService.update(
          this.options.currentTenant.id,
          {
            hasSampleData: false,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(tx)
      this.log.info(`Sample data for tenant ${this.options.currentTenant.id} deleted succesfully.`)
    } catch (err) {
      this.log.error(err, 'Error deleting sample data!')
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw err
    }
  }
}
