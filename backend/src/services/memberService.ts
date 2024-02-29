/* eslint-disable no-continue */

import { SERVICE, Error400, isDomainExcluded } from '@crowd/common'
import { LoggerBase } from '@crowd/logging'
import { WorkflowIdReusePolicy } from '@crowd/temporal'
import {
  ExportableEntity,
  FeatureFlag,
  IMemberIdentity,
  IMemberUnmergeBackup,
  IMemberUnmergePreviewResult,
  IOrganization,
  ISearchSyncOptions,
  IUnmergePreviewResult,
  MemberAttributeType,
  MergeActionState,
  MergeActionType,
  SyncMode,
  TemporalWorkflowId,
  MemberRoleUnmergeStrategy,
} from '@crowd/types'
import { randomUUID } from 'crypto'
import lodash from 'lodash'
import moment from 'moment-timezone'
import validator from 'validator'
import { getOpensearchClient } from '@crowd/opensearch'
import { OPENSEARCH_CONFIG, TEMPORAL_CONFIG } from '@/conf'
import { IRepositoryOptions } from '../database/repositories/IRepositoryOptions'
import ActivityRepository from '../database/repositories/activityRepository'
import MemberAttributeSettingsRepository from '../database/repositories/memberAttributeSettingsRepository'
import MemberRepository from '../database/repositories/memberRepository'
import SegmentRepository from '../database/repositories/segmentRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import TagRepository from '../database/repositories/tagRepository'
import {
  IActiveMemberFilter,
  IMemberMergeSuggestion,
  IMemberMergeSuggestionsType,
  mapUsernameToIdentities,
} from '../database/repositories/types/memberTypes'
import isFeatureEnabled from '../feature-flags/isFeatureEnabled'
import telemetryTrack from '../segment/telemetryTrack'
import { IServiceOptions } from './IServiceOptions'
import merge from './helpers/merge'
import MemberAttributeSettingsService from './memberAttributeSettingsService'
import OrganizationService from './organizationService'
import SearchSyncService from './searchSyncService'
import SettingsService from './settingsService'
import { GITHUB_TOKEN_CONFIG } from '../conf'
import { ServiceType } from '@/conf/configTypes'
import { getNodejsWorkerEmitter } from '@/serverless/utils/serviceSQS'
import MemberOrganizationService from './memberOrganizationService'
import { MergeActionsRepository } from '@/database/repositories/mergeActionsRepository'
import MemberOrganizationRepository from '@/database/repositories/memberOrganizationRepository'
import OrganizationRepository from '@/database/repositories/organizationRepository'

export default class MemberService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  /**
   * Validates the attributes against its saved settings.
   *
   * Throws 400 Errors if the attribute does not exist in settings,
   * or if the sent attribute type does not match the type in the settings.
   * Also restructures custom attributes that come only as a value, without platforms.
   *
   * Example custom attributes restructuring
   * {
   *   attributes: {
   *      someAttributeName: 'someValue'
   *   }
   * }
   *
   * This object is transformed into:
   * {
   *   attributes: {
   *     someAttributeName: {
   *        custom: 'someValue'
   *     },
   *   }
   * }
   *
   * @param attributes
   * @returns restructured object
   */
  async validateAttributes(
    attributes: { [key: string]: any },
    transaction = null,
  ): Promise<object> {
    // check attribute exists in memberAttributeSettings

    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll(
        {},
        { ...this.options, ...(transaction && { transaction }) },
      )
    ).rows.reduce((acc, attribute) => {
      acc[attribute.name] = attribute
      return acc
    }, {})

    for (const attributeName of Object.keys(attributes)) {
      if (!memberAttributeSettings[attributeName]) {
        this.log.error('Attribute does not exist', {
          attributeName,
          attributes,
        })
        delete attributes[attributeName]
        continue
      }
      if (typeof attributes[attributeName] !== 'object') {
        attributes[attributeName] = {
          custom: attributes[attributeName],
        }
      }

      for (const platform of Object.keys(attributes[attributeName])) {
        if (
          attributes[attributeName][platform] !== undefined &&
          attributes[attributeName][platform] !== null
        ) {
          if (
            !MemberAttributeSettingsService.isCorrectType(
              attributes[attributeName][platform],
              memberAttributeSettings[attributeName].type,
              { options: memberAttributeSettings[attributeName].options },
            )
          ) {
            this.log.error('Failed to validate attributee', {
              attributeName,
              platform,
              attributeValue: attributes[attributeName][platform],
              attributeType: memberAttributeSettings[attributeName].type,
              options: memberAttributeSettings[attributeName].options,
            })
            throw new Error400(
              this.options.language,
              'settings.memberAttributes.wrongType',
              attributeName,
              memberAttributeSettings[attributeName].type,
            )
          }
        }
      }
    }

    return attributes
  }

  /**
   * Sets the attribute.default key as default values of attribute
   * object using the priority array stored in the settings.
   * Throws a 400 Error if priority array does not exist.
   * @param attributes
   * @returns attribute object with default values
   */
  async setAttributesDefaultValues(attributes: object): Promise<object> {
    if (!(await SettingsService.platformPriorityArrayExists(this.options))) {
      throw new Error400(this.options.language, 'settings.memberAttributes.priorityArrayNotFound')
    }

    const priorityArray = this.options.currentTenant.settings[0].get({ plain: true })
      .attributeSettings.priorities

    for (const attributeName of Object.keys(attributes)) {
      const highestPriorityPlatform = MemberService.getHighestPriorityPlatformForAttributes(
        Object.keys(attributes[attributeName]),
        priorityArray,
      )

      if (highestPriorityPlatform !== undefined) {
        attributes[attributeName].default = attributes[attributeName][highestPriorityPlatform]
      } else {
        delete attributes[attributeName]
      }
    }

    return attributes
  }

  /**
   * Returns the highest priority platform from an array of platforms
   * If any of the platforms does not exist in the priority array, returns
   * the first platform sent as the highest priority platform.
   * @param platforms Array of platforms to select the highest priority platform
   * @param priorityArray zero indexed priority array. Lower index means higher priority
   * @returns the highest priority platform or undefined if values are incorrect
   */
  public static getHighestPriorityPlatformForAttributes(
    platforms: string[],
    priorityArray: string[],
  ): string | undefined {
    if (platforms.length <= 0) {
      return undefined
    }
    const filteredPlatforms = priorityArray.filter((i) => platforms.includes(i))
    return filteredPlatforms.length > 0 ? filteredPlatforms[0] : platforms[0]
  }

  /**
   * Upsert a member. If the member exists, it updates it. If it does not exist, it creates it.
   * The update is done with a deep merge of the original and the new member.
   * The member is returned without relations
   * Only the fields that have changed are updated.
   * @param data Data for the member
   * @param existing If the member already exists. If it does not, false. Othwerwise, the member.
   * @returns The created member
   */
  async upsert(
    data,
    existing: boolean | any = false,
    fireCrowdWebhooks: boolean = true,
    syncToOpensearch = true,
  ) {
    const logger = this.options.log
    const searchSyncService = new SearchSyncService(
      this.options,
      SERVICE === ServiceType.NODEJS_WORKER ? SyncMode.ASYNCHRONOUS : undefined,
    )

    const errorDetails: any = {}

    if (!('platform' in data)) {
      throw new Error400(this.options.language, 'activity.platformRequiredWhileUpsert')
    }

    data.username = mapUsernameToIdentities(data.username, data.platform)

    if (!(data.platform in data.username)) {
      throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
    }

    if (!data.displayName) {
      data.displayName = data.username[data.platform][0].username
    }

    if (!(data.platform in data.username)) {
      throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
    }

    if (!data.displayName) {
      data.displayName = data.username[data.platform].username
    }

    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.activities) {
        data.activities = await ActivityRepository.filterIdsInTenant(data.activities, {
          ...this.options,
          transaction,
        })
      }
      if (data.tags) {
        data.tags = await TagRepository.filterIdsInTenant(data.tags, {
          ...this.options,
          transaction,
        })
      }
      if (data.noMerge) {
        data.noMerge = await MemberRepository.filterIdsInTenant(data.noMerge, {
          ...this.options,
          transaction,
        })
      }
      if (data.toMerge) {
        data.toMerge = await MemberRepository.filterIdsInTenant(data.toMerge, {
          ...this.options,
          transaction,
        })
      }

      const { platform } = data

      if (data.attributes) {
        data.attributes = await this.validateAttributes(data.attributes, transaction)
      }

      if (data.reach) {
        data.reach = typeof data.reach === 'object' ? data.reach : { [platform]: data.reach }
        data.reach = MemberService.calculateReach(data.reach, {})
      } else {
        data.reach = { total: -1 }
      }

      delete data.platform

      if (!('joinedAt' in data)) {
        data.joinedAt = moment.tz('Europe/London').toDate()
      }

      if (!existing) {
        existing = await this.memberExists(data.username, platform)
      } else {
        // let's look just in case for an existing member and if they are different we should log them because they will probably fail to insert
        const tempExisting = await this.memberExists(data.username, platform)

        if (!tempExisting) {
          logger.warn(
            { existingMemberId: existing.id },
            'We have received an existing member but actually we could not find him by username and platform!',
          )
          errorDetails.reason = 'member_service_upsert_existing_member_not_found'
          errorDetails.details = {
            existingMemberId: existing.id,
            username: data.username,
            platform,
          }
        } else if (existing.id !== tempExisting.id) {
          logger.warn(
            { existingMemberId: existing.id, actualExistingMemberId: tempExisting.id },
            'We found a member with the same username and platform but different id!',
          )
          errorDetails.reason = 'member_service_upsert_existing_member_mismatch'
          errorDetails.details = {
            existingMemberId: existing.id,
            actualExistingMemberId: tempExisting.id,
            username: data.username,
            platform,
          }
        }
      }

      // Collect IDs for relation
      const organizations = []
      // If organizations are sent
      if (data.organizations) {
        for (const organization of data.organizations) {
          if (typeof organization === 'string' && validator.isUUID(organization)) {
            // If an ID was already sent, we simply push it to the list
            organizations.push(organization)
          } else if (typeof organization === 'object' && organization.id) {
            organizations.push(organization)
          } else {
            // Otherwise, either another string or an object was sent
            const organizationService = new OrganizationService(this.options)
            let data = {}
            if (typeof organization === 'string') {
              // If a string was sent, we assume it is the name of the organization
              data = {
                identities: [
                  {
                    name: organization,
                    platform,
                  },
                ],
              }
            } else {
              // Otherwise, we assume it is an object with the data of the organization
              data = organization
            }
            // We createOrUpdate the organization and add it to the list of IDs
            const organizationRecord = await organizationService.createOrUpdate(
              data as IOrganization,
              {
                doSync: syncToOpensearch,
                mode: SyncMode.ASYNCHRONOUS,
              },
            )
            organizations.push({ id: organizationRecord.id })
          }
        }
      }

      // Auto assign member to organization if email domain matches
      if (data.emails) {
        const emailDomains = new Set<string>()

        // Collect unique domains
        for (const email of data.emails) {
          if (email) {
            const domain = email.split('@')[1]
            if (!isDomainExcluded(domain)) {
              emailDomains.add(domain)
            }
          }
        }

        // Fetch organization ids for these domains
        const organizationService = new OrganizationService(this.options)
        for (const domain of emailDomains) {
          if (domain) {
            const org = await organizationService.createOrUpdate(
              {
                website: domain,
                identities: [
                  {
                    name: domain,
                    platform: 'email',
                  },
                ],
              },
              {
                doSync: syncToOpensearch,
                mode: SyncMode.ASYNCHRONOUS,
              },
            )

            if (org) {
              organizations.push({ id: org.id })
            }
          }
        }
      }

      // Remove dups
      if (organizations.length > 0) {
        data.organizations = lodash.uniqBy(organizations, 'id')
      }

      const fillRelations = false

      let record
      if (existing) {
        const { id } = existing
        delete existing.id
        const toUpdate = MemberService.membersMerge(existing, data)

        if (toUpdate.attributes) {
          toUpdate.attributes = await this.setAttributesDefaultValues(toUpdate.attributes)
        }

        // It is important to call it with doPopulateRelations=false
        // because otherwise the performance is greatly decreased in integrations
        record = await MemberRepository.update(
          id,
          toUpdate,
          {
            ...this.options,
            transaction,
          },
          fillRelations,
        )
      } else {
        // It is important to call it with doPopulateRelations=false
        // because otherwise the performance is greatly decreased in integrations
        if (data.attributes) {
          data.attributes = await this.setAttributesDefaultValues(data.attributes)
        }

        record = await MemberRepository.create(
          data,
          {
            ...this.options,
            transaction,
          },
          fillRelations,
        )

        telemetryTrack(
          'Member created',
          {
            id: record.id,
            createdAt: record.createdAt,
            sample: record.attributes.sample?.crowd,
            identities: Object.keys(record.username),
          },
          this.options,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)

      if (syncToOpensearch) {
        await searchSyncService.triggerMemberSync(this.options.currentTenant.id, record.id)
      }

      if (!existing && fireCrowdWebhooks) {
        try {
          const handle = await this.options.temporal.workflow.start('processNewMemberAutomation', {
            workflowId: `${TemporalWorkflowId.NEW_MEMBER_AUTOMATION}/${record.id}`,
            taskQueue: TEMPORAL_CONFIG.automationsTaskQueue,
            workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
            retry: {
              maximumAttempts: 100,
            },

            args: [
              {
                tenantId: this.options.currentTenant.id,
                memberId: record.id,
              },
            ],
            searchAttributes: {
              TenantId: [this.options.currentTenant.id],
            },
          })
          this.log.info(
            { workflowId: handle.workflowId },
            'Started temporal workflow to process new member automation!',
          )
        } catch (err) {
          logger.error(err, `Error triggering new member automation - ${record.id}!`)
        }
      }

      if (!fireCrowdWebhooks) {
        this.log.info('Ignoring outgoing webhooks because of fireCrowdWebhooks!')
      }

      return record
    } catch (error) {
      const reason = errorDetails.reason || undefined
      const details = errorDetails.details || undefined

      if (error.name && error.name.includes('Sequelize')) {
        logger.error(
          error,
          {
            query: error.sql,
            errorMessage: error.original.message,
            reason,
            details,
          },
          'Error during member upsert!',
        )
      } else {
        logger.error(error, { reason, details }, 'Error during member upsert!')
      }

      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'member')

      throw { ...error, reason, details }
    }
  }

  /**
   * Checks if given user already exists by username and platform.
   * Username can be given as a plain string or as dictionary with
   * related platforms.
   * Ie:
   * username = 'anil' || username = { github: 'anil' } || username = { github: 'anil', twitter: 'some-other-username' } || username = { github: { username: 'anil' } } || username = { github: [{ username: 'anil' }] }
   * @param username username of the member
   * @param platform platform of the member
   * @returns null | found member
   */
  async memberExists(username: object | string, platform: string) {
    const fillRelations = false

    const usernames: string[] = []

    if (typeof username === 'string') {
      usernames.push(username)
    } else if (typeof username === 'object') {
      if ('username' in username) {
        usernames.push((username as any).username)
      } else if (platform in username) {
        if (typeof username[platform] === 'string') {
          usernames.push(username[platform])
        } else if (Array.isArray(username[platform])) {
          if (username[platform].length === 0) {
            throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
          } else if (typeof username[platform] === 'string') {
            usernames.push(...username[platform])
          } else if (typeof username[platform][0] === 'object') {
            usernames.push(...username[platform].map((u) => u.username))
          }
        } else if (typeof username[platform] === 'object') {
          usernames.push(username[platform].username)
        } else {
          throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
        }
      } else {
        throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
      }
    }

    // It is important to call it with doPopulateRelations=false
    // because otherwise the performance is greatly decreased in integrations
    const existing = await MemberRepository.memberExists(
      usernames,
      platform,
      {
        ...this.options,
      },
      fillRelations,
    )

    return existing
  }

  /**
   * Unmerges two members given a preview payload.
   * Payload is returned from unmerge/preview endpoint, and confirmed by the user
   * Payload.primary has the primary member's unmerged data, current member will be updated using these fields.
   * Payload.secondary has the member that'll be unmerged/extracted from the primary member. This member will be created
   * Activity moving, syncing to opensearch, recalculating activity.organizationIds and notifying frontend via websockets
   * is done asynchronously, via entity-merge temporal worker finishMemberUnmerging workflow.
   * @param memberId memberId of the primary member
   * @param payload unmerge preview payload
   */
  async unmerge(
    memberId: string,
    payload: IUnmergePreviewResult<IMemberUnmergePreviewResult>,
  ): Promise<void> {
    let tx

    try {
      const member = await MemberRepository.findById(memberId, this.options)

      const repoOptions: IRepositoryOptions =
        await SequelizeRepository.createTransactionalRepositoryOptions(this.options)
      tx = repoOptions.transaction

      // remove identities in secondary member from primary member
      await MemberRepository.removeIdentitiesFromMember(
        memberId,
        payload.secondary.identities,
        repoOptions,
      )

      // create the secondary member
      const secondaryMember = await MemberRepository.create(payload.secondary, repoOptions)

      // move affiliations
      if (payload.secondary.affiliations.length > 0) {
        await MemberRepository.moveSelectedAffiliationsBetweenMembers(
          memberId,
          secondaryMember.id,
          payload.secondary.affiliations.map((a) => a.id),
          repoOptions,
        )
      }

      // move tags
      if (payload.secondary.tags.length > 0) {
        await MemberRepository.addTagsToMember(
          secondaryMember.id,
          payload.secondary.tags.map((t) => t.id),
          repoOptions,
        )
        // check if anything to delete in primary
        const tagsToDelete = member.tags.filter(
          (t) => !payload.primary.tags.some((pt) => pt.id === t.id),
        )
        if (tagsToDelete.length > 0) {
          await MemberRepository.removeTagsFromMember(
            memberId,
            tagsToDelete.map((t) => t.id),
            repoOptions,
          )
        }
      }

      // move tasks
      if (payload.secondary.tasks.length > 0) {
        await MemberRepository.addTasksToMember(
          secondaryMember.id,
          payload.secondary.tasks.map((t) => t.id),
          repoOptions,
        )
        // check if anything to delete in primary
        const tasksToDelete = member.tasks.filter(
          (t) => !payload.primary.tasks.some((pt) => pt.id === t.id),
        )
        if (tasksToDelete.length > 0) {
          await MemberRepository.removeTasksFromMember(
            memberId,
            tasksToDelete.map((t) => t.id),
            repoOptions,
          )
        }
      }

      // move notes
      if (payload.secondary.notes.length > 0) {
        await MemberRepository.addNotesToMember(
          secondaryMember.id,
          payload.secondary.notes.map((n) => n.id),
          repoOptions,
        )
        // check if anything to delete in primary
        const notesToDelete = member.notes.filter(
          (n) => !payload.primary.notes.some((pn) => pn.id === n.id),
        )
        if (notesToDelete.length > 0) {
          await MemberRepository.removeNotesFromMember(
            memberId,
            notesToDelete.map((n) => n.id),
            repoOptions,
          )
        }
      }

      // move memberOrganizations
      if (payload.secondary.memberOrganizations.length > 0) {
        for (const role of payload.secondary.memberOrganizations) {
          await MemberOrganizationRepository.addMemberRole(
            { ...role, memberId: secondaryMember.id },
            repoOptions,
          )
        }

        const memberOrganizations = await MemberOrganizationRepository.findMemberRoles(
          member.id,
          repoOptions,
        )
        // check if anything to delete in primary
        const rolesToDelete = memberOrganizations.filter(
          (r) =>
            r.source !== 'ui' &&
            !payload.primary.memberOrganizations.some(
              (pr) =>
                pr.organizationId === r.organizationId &&
                pr.title === r.title &&
                pr.dateStart === r.dateStart &&
                pr.dateEnd === r.dateEnd,
            ),
        )

        for (const role of rolesToDelete) {
          await MemberOrganizationRepository.removeMemberRole(role, repoOptions)
        }
      }

      // delete relations from payload, since we already handled those
      delete payload.primary.identities
      delete payload.primary.username
      delete payload.primary.memberOrganizations
      delete payload.primary.organizations
      delete payload.primary.tags
      delete payload.primary.notes
      delete payload.primary.tasks
      delete payload.primary.affiliations

      // update rest of the primary member fields
      await MemberRepository.update(memberId, payload.primary, repoOptions, false, false)

      // trigger entity-merging-worker to move activities in the background
      await SequelizeRepository.commitTransaction(tx)

      // responsible for moving member's activities, syncing to opensearch afterwards, recalculating activity.organizationIds and notifying frontend via websockets
      await this.options.temporal.workflow.start('finishMemberUnmerging', {
        taskQueue: 'entity-merging',
        workflowId: `finishMemberUnmerging/${member.id}/${secondaryMember.id}`,
        retry: {
          maximumAttempts: 10,
        },
        args: [
          member.id,
          secondaryMember.id,
          payload.secondary.identities,
          member.displayName,
          secondaryMember.displayName,
          this.options.currentTenant.id,
          this.options.currentUser.id,
        ],
        searchAttributes: {
          TenantId: [this.options.currentTenant.id],
        },
      })
    } catch (err) {
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }
      throw err
    }
  }

  /**
   * Returns a preview of primary and secondary members after a possible unmerge operation
   * Preview is built using the identity sent. First we try to find the corresponding mergeAction.unmergeBackup
   * If we find the backup, we return preview by doing an in-place unmerge between two members.
   * If backup is not found, preview will be for an identity extraction
   * This will only return a preview, users will be able to edit the preview and confirm the payload
   * Unmerge will be done in /unmerge endpoint with the confirmed payload from the user.
   * @param memberId member for identity extraction/unmerge
   * @param identity identity to be extracted/unmerged
   */
  async unmergePreview(
    memberId: string,
    identity: IMemberIdentity,
  ): Promise<IUnmergePreviewResult<IMemberUnmergePreviewResult>> {
    const relationships = ['tags', 'notes', 'tasks', 'identities', 'affiliations']

    try {
      const member = await MemberRepository.findById(memberId, this.options)

      member.memberOrganizations = await MemberOrganizationRepository.findMemberRoles(
        memberId,
        this.options,
      )

      // check member has the sent identity
      const memberIdentities = await MemberRepository.getRawMemberIdentities(memberId, this.options)

      if (
        !memberIdentities.some(
          (i) => i.platform === identity.platform && i.username === identity.username,
        )
      ) {
        throw new Error(`Member doesn't have the identity sent to be unmerged!`)
      }

      member.identities = memberIdentities

      const mergeAction = await MergeActionsRepository.findMergeBackup(
        memberId,
        MergeActionType.MEMBER,
        identity,
        this.options,
      )

      if (mergeAction) {
        // mergeAction is found, unmerge preview will be generated

        const primaryBackup = mergeAction.unmergeBackup.primary as IMemberUnmergeBackup
        const secondaryBackup = mergeAction.unmergeBackup.secondary as IMemberUnmergeBackup

        // construct primary member with best effort
        for (const key of MemberService.MEMBER_MERGE_FIELDS) {
          // delay relationships for later
          if (!(key in relationships) && !member.manuallyChangedFields.includes(key)) {
            if (key === 'attributes') {
              // 1) if both primary and secondary backup have the attribute, check any platform specific value came from merge, if current member has it, revert it
              // 2) if primary backup doesn't have the attribute, and secondary backup does, check if current member has the same value, if yes revert it (it came through merge)
              // 3) if primary backup has the attribute, and secondary doesn't, keep the current value
              // 4) if both backups doesn't have the value, but current member does, keep the current value
              // we only need to act on cases 1 and 2, because we don't need to change current member's attributes for other cases

              // loop through current member attributes
              for (const attributeKey of Object.keys(member.attributes)) {
                if (!member.manuallyChangedFields.some((f) => f === `attributes.${key}`)) {
                  // both backups have the attribute
                  if (
                    primaryBackup.attributes[attributeKey] &&
                    secondaryBackup.attributes[attributeKey]
                  ) {
                    // find platform key values that exist on secondary, but not on primary backup
                    const platformKeysThatOnlyExistOnSecondaryBackup = Object.keys(
                      secondaryBackup.attributes[attributeKey],
                    ).filter(
                      (key) =>
                        primaryBackup.attributes[attributeKey][key] === null ||
                        primaryBackup.attributes[attributeKey][key] === undefined ||
                        primaryBackup.attributes[attributeKey][key] === '',
                    )

                    for (const platformKey of platformKeysThatOnlyExistOnSecondaryBackup) {
                      // check current member still has this value for the attribute[key][platform], and primary backup didn't have this value
                      if (
                        member.attributes[attributeKey][platformKey] ===
                          secondaryBackup.attributes[attributeKey][platformKey] &&
                        primaryBackup.attributes[attributeKey][platformKey] !==
                          member.attributes[attributeKey][platformKey]
                      ) {
                        delete member.attributes[attributeKey][platformKey]
                      }
                      if (Object.keys(member.attributes[attributeKey]).length === 0) {
                        delete member.attributes[attributeKey]
                      }
                    }
                  } else if (
                    !primaryBackup.attributes[attributeKey] &&
                    secondaryBackup.attributes[attributeKey]
                  ) {
                    // remove platform keys that has the same value with current member
                    if (member.attributes[attributeKey]) {
                      for (const platformKey of Object.keys(member.attributes[attributeKey])) {
                        if (
                          member.attributes[attributeKey][platformKey] ===
                          secondaryBackup.attributes[attributeKey][platformKey]
                        ) {
                          delete member.attributes[attributeKey][platformKey]
                        }
                      }

                      // check any platform keys remaining on current member, if not remove the attribute completely
                      if (Object.keys(member.attributes[attributeKey]).length === 0) {
                        delete member.attributes[attributeKey]
                      }
                    }
                  }
                }
              }
            } else if (key === 'emails') {
              member.emails = member.emails.filter(
                (e) => !secondaryBackup.emails.some((s) => s === e),
              )
            } else if (key === 'reach') {
              // only act on reach if current member has some data
              for (const reachKey of Object.keys(member.reach)) {
                if (
                  reachKey !== 'total' &&
                  secondaryBackup.reach[reachKey] === member.reach[reachKey]
                ) {
                  delete member.reach[reachKey]
                }
              }
              // check if there are any keys other than total, if yes recalculate total, else set total to -1
              if (Object.keys(member.reach).length > 1) {
                delete member.reach.total
                member.reach.total = lodash.sum(Object.values(member.reach))
              } else {
                member.reach.total = -1
              }
            } else if (key === 'contributions') {
              // check secondary member has any contributions to extract from current member
              if (member.contributions) {
                member.contributions = member.contributions.filter(
                  (c) => !(secondaryBackup.contributions || []).some((s) => s.id === c.id),
                )
              }
            } else if (primaryBackup[key] !== member[key] && secondaryBackup[key] === member[key]) {
              member[key] = null
            }
          }
        }

        // tags: Remove tags that exist in secondary backup, but not in primary backup
        member.tags = member.tags.filter(
          (tag) =>
            !(
              secondaryBackup.tags.some((t) => t.id === tag.id) &&
              !primaryBackup.tags.some((t) => t.id === tag.id)
            ),
        )

        // notes: Remove notes that exist in secondary backup, but not in primary backup
        member.notes = member.notes.filter(
          (note) =>
            !(
              secondaryBackup.notes.some((n) => n.id === note.id) &&
              !primaryBackup.notes.some((n) => n.id === note.id)
            ),
        )

        // tasks: Remove tasks that exist in secondary backup, but not in primary backup
        member.tasks = member.tasks.filter(
          (task) =>
            !(
              secondaryBackup.tasks.some((t) => t.id === task.id) &&
              !primaryBackup.tasks.some((t) => t.id === task.id)
            ),
        )

        // identities: Remove identities coming from secondary backup
        member.identities = member.identities.filter(
          (i) =>
            !secondaryBackup.identities.some(
              (s) => s.platform === i.platform && s.username === i.username,
            ),
        )

        // affiliations: Remove affiliations coming from secondary backup
        member.affiliations = member.affiliations.filter(
          (a) =>
            !secondaryBackup.affiliations.some(
              (s) =>
                s.segmentId === a.segmentId &&
                s.organizationId === a.organizationId &&
                s.dateStart === a.dateStart &&
                s.dateEnd === a.dateEnd,
            ),
        )

        // member organizations
        const unmergedRoles = MemberOrganizationService.unmergeRoles(
          member.memberOrganizations,
          primaryBackup.memberOrganizations,
          secondaryBackup.memberOrganizations,
          MemberRoleUnmergeStrategy.SAME_MEMBER,
        )
        member.memberOrganizations = unmergedRoles

        // activity count
        const secondaryActivityCount = await MemberRepository.getActivityCountOfMembersIdentities(
          member.id,
          secondaryBackup.identities,
          this.options,
        )
        const primaryActivityCount = await MemberRepository.getActivityCountOfMembersIdentities(
          member.id,
          member.identities,
          this.options,
        )

        return {
          primary: {
            ...lodash.pick(member, MemberService.MEMBER_MERGE_FIELDS),
            identities: member.identities,
            memberOrganizations: member.memberOrganizations,
            organizations: OrganizationRepository.calculateRenderFriendlyOrganizations(
              member.memberOrganizations,
            ),
            username: MemberRepository.getUsernameFromIdentities(member.identities),
            activityCount: primaryActivityCount,
            numberOfOpenSourceContributions: member.contributions?.length || 0,
          },
          secondary: {
            ...secondaryBackup,
            organizations: OrganizationRepository.calculateRenderFriendlyOrganizations(
              secondaryBackup.memberOrganizations,
            ),
            activityCount: secondaryActivityCount,
            numberOfOpenSourceContributions: secondaryBackup.contributions?.length || 0,
          },
        }
      }

      // mergeAction is not found, identity extraction preview will be generated
      const secondaryIdentities = [identity]
      const primaryIdentities = member.identities.filter(
        (i) =>
          !secondaryIdentities.some((s) => s.platform === i.platform && s.username === i.username),
      )

      if (primaryIdentities.length === 0) {
        throw new Error(`Original member only has one identity, cannot extract it!`)
      }

      const secondaryActivityCount = await MemberRepository.getActivityCountOfMembersIdentities(
        member.id,
        secondaryIdentities,
        this.options,
      )

      const primaryActivityCount = await MemberRepository.getActivityCountOfMembersIdentities(
        member.id,
        primaryIdentities,
        this.options,
      )

      const primaryMemberRoles = await MemberOrganizationRepository.findMemberRoles(
        member.id,
        this.options,
      )

      return {
        primary: {
          ...lodash.pick(member, MemberService.MEMBER_MERGE_FIELDS),
          identities: primaryIdentities,
          memberOrganizations: primaryMemberRoles,
          organizations:
            OrganizationRepository.calculateRenderFriendlyOrganizations(primaryMemberRoles),
          username: MemberRepository.getUsernameFromIdentities(primaryIdentities),
          activityCount: primaryActivityCount,
          numberOfOpenSourceContributions: member.contributions?.length || 0,
        },
        secondary: {
          id: randomUUID(),
          reach: { total: -1 },
          username: MemberRepository.getUsernameFromIdentities(secondaryIdentities),
          displayName: identity.username,
          identities: secondaryIdentities,
          memberOrganizations: [],
          organizations: [],
          tags: [],
          notes: [],
          tasks: [],
          emails: [],
          attributes: {},
          joinedAt: new Date().toISOString(),
          tenantId: member.tenantId,
          affiliations: [],
          contributions: [],
          manuallyCreated: true,
          manuallyChangedFields: [],
          activityCount: secondaryActivityCount,
          numberOfOpenSourceContributions: 0,
        },
      }
    } catch (err) {
      this.options.log.error(err, 'Error while generating unmerge/identity extraction preview!')
      throw err
    }
  }

  static MEMBER_MERGE_FIELDS = [
    'id',
    'tags',
    'notes',
    'reach',
    'tasks',
    'emails',
    'joinedAt',
    'tenantId',
    'username',
    'attributes',
    'displayName',
    'affiliations',
    'contributions',
    'manuallyCreated',
    'manuallyChangedFields',
  ]

  /**
   * Perform a merge between two members.
   * - For all fields, a deep merge is performed.
   * - Then, an object is obtained with the fields that have been changed in the deep merge.
   * - The original member is updated,
   * - the other member is destroyed, and
   * - the toMerge field in tenant is updated, where each entry with the toMerge member is removed.
   * @param originalId ID of the original member. This is the member that will be updated.
   * @param toMergeId ID of the member that will be merged into the original member and deleted.
   * @returns Success/Error message
   */
  async merge(
    originalId,
    toMergeId,
    syncOptions: ISearchSyncOptions = { doSync: true, mode: SyncMode.USE_FEATURE_FLAG },
  ) {
    this.options.log.info({ originalId, toMergeId }, 'Merging members!')

    let tx

    try {
      const original = await MemberRepository.findById(originalId, this.options)
      const toMerge = await MemberRepository.findById(toMergeId, this.options)

      const backup = {
        primary: {
          ...lodash.pick(original, MemberService.MEMBER_MERGE_FIELDS),
          identities: await MemberRepository.getRawMemberIdentities(originalId, this.options),
          memberOrganizations: await MemberOrganizationRepository.findMemberRoles(
            originalId,
            this.options,
          ),
        },
        secondary: {
          ...lodash.pick(toMerge, MemberService.MEMBER_MERGE_FIELDS),
          identities: await MemberRepository.getRawMemberIdentities(toMergeId, this.options),
          memberOrganizations: await MemberOrganizationRepository.findMemberRoles(
            toMergeId,
            this.options,
          ),
        },
      }

      await MergeActionsRepository.add(
        MergeActionType.MEMBER,
        originalId,
        toMergeId,
        this.options,
        MergeActionState.IN_PROGRESS,
        backup,
      )

      if (original.id === toMerge.id) {
        return {
          status: 203,
          mergedId: originalId,
        }
      }

      const repoOptions: IRepositoryOptions =
        await SequelizeRepository.createTransactionalRepositoryOptions(this.options)
      tx = repoOptions.transaction

      const allIdentities = await MemberRepository.getIdentities(
        [originalId, toMergeId],
        repoOptions,
      )

      const originalIdentities = allIdentities.get(originalId)
      const toMergeIdentities = allIdentities.get(toMergeId)
      const identitiesToMove = []
      for (const identity of toMergeIdentities) {
        if (
          !originalIdentities.find(
            (i) => i.platform === identity.platform && i.username === identity.username,
          )
        ) {
          identitiesToMove.push(identity)
        }
      }

      await MemberRepository.moveIdentitiesBetweenMembers(
        toMergeId,
        originalId,
        identitiesToMove,
        repoOptions,
      )

      // Update notes to belong to the originalId member
      await MemberRepository.moveNotesBetweenMembers(toMergeId, originalId, repoOptions)

      // Update tasks to belong to the originalId member
      await MemberRepository.moveTasksBetweenMembers(toMergeId, originalId, repoOptions)

      // Update member affiliations
      await MemberRepository.moveAffiliationsBetweenMembers(toMergeId, originalId, repoOptions)

      // Get tags as array of ids (findById returns them as models)
      original.tags = original.tags.map((i) => i.get({ plain: true }).id)
      toMerge.tags = toMerge.tags.map((i) => i.get({ plain: true }).id)

      // leave member activities alone - we will update them with a single query later
      delete original.activities
      delete toMerge.activities

      // Performs a merge and returns the fields that were changed so we can update
      const toUpdate: any = await MemberService.membersMerge(original, toMerge)

      // we will handle activities later manually
      delete toUpdate.activities
      // we already handled identities
      delete toUpdate.username
      // we merge them manually
      delete toUpdate.organizations

      // Update original member
      const txService = new MemberService(repoOptions as IServiceOptions)
      await txService.update(originalId, toUpdate, false)

      // update members that belong to source organization to destination org
      const memberOrganizationService = new MemberOrganizationService(repoOptions)
      await memberOrganizationService.moveOrgsBetweenMembers(originalId, toMergeId)

      // Remove toMerge from original member
      await MemberRepository.removeToMerge(originalId, toMergeId, repoOptions)

      const secondMemberSegments = await MemberRepository.getMemberSegments(toMergeId, repoOptions)

      await MemberRepository.includeMemberToSegments(toMergeId, {
        ...repoOptions,
        currentSegments: secondMemberSegments,
      })

      await SequelizeRepository.commitTransaction(tx)

      await this.options.temporal.workflow.start('finishMemberMerging', {
        taskQueue: 'entity-merging',
        workflowId: `finishMemberMerging/${originalId}/${toMergeId}`,
        retry: {
          maximumAttempts: 10,
        },
        args: [originalId, toMergeId, this.options.currentTenant.id],
        searchAttributes: {
          TenantId: [this.options.currentTenant.id],
        },
      })

      if (syncOptions.doSync) {
        try {
          const searchSyncService = new SearchSyncService(this.options, syncOptions.mode)

          await searchSyncService.triggerMemberSync(this.options.currentTenant.id, originalId)
          await searchSyncService.triggerRemoveMember(this.options.currentTenant.id, toMergeId)
        } catch (emitError) {
          this.log.error(
            emitError,
            {
              tenantId: this.options.currentTenant.id,
              originalId,
              toMergeId,
            },
            'Error while triggering member sync changes!',
          )
        }
      }

      this.options.log.info({ originalId, toMergeId }, 'Members merged!')
      return { status: 200, mergedId: originalId }
    } catch (err) {
      this.options.log.error(err, 'Error while merging members!')
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }
      throw err
    }
  }

  /**
   * Call the merge function with the special fields for members.
   * We want to always keep the earlies joinedAt date.
   * We always want the original displayName.
   * @param originalObject Original object to merge
   * @param toMergeObject Object to merge into the original object
   * @returns The updates to be performed on the original object
   */
  static membersMerge(originalObject, toMergeObject) {
    return merge(originalObject, toMergeObject, {
      joinedAt: (oldDate, newDate) => {
        // If either the new or the old date are earlier than 1970
        // it means they come from an activity without timestamp
        // and we want to keep the other one
        if (moment(oldDate).subtract(5, 'days').unix() < 0) {
          return newDate
        }
        if (moment(newDate).unix() < 0) {
          return oldDate
        }
        return moment
          .min(moment.tz(oldDate, 'Europe/London'), moment.tz(newDate, 'Europe/London'))
          .toDate()
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      displayName: (oldValue, _newValue) => oldValue,
      reach: (oldReach, newReach) => MemberService.calculateReach(oldReach, newReach),
      score: (oldScore, newScore) => Math.max(oldScore, newScore),
      emails: (oldEmails, newEmails) => {
        if (!oldEmails && !newEmails) {
          return []
        }

        oldEmails = oldEmails ?? []
        newEmails = newEmails ?? []

        const emailSet = new Set<string>(oldEmails)
        newEmails.forEach((email) => emailSet.add(email))

        return Array.from(emailSet)
      },
      username: (oldUsernames, newUsernames) => {
        // we want to keep just the usernames that are not already in the oldUsernames
        const toKeep: any = {}

        const actualOld = mapUsernameToIdentities(oldUsernames)
        const actualNew = mapUsernameToIdentities(newUsernames)

        for (const [platform, identities] of Object.entries(actualNew)) {
          const oldIdentities = actualOld[platform]

          if (oldIdentities) {
            const identitiesToKeep = []
            for (const newIdentity of identities as any[]) {
              let keep = true
              for (const oldIdentity of oldIdentities) {
                if (oldIdentity.username === newIdentity.username) {
                  keep = false
                  break
                }
              }

              if (keep) {
                identitiesToKeep.push(newIdentity)
              }
            }

            if (identitiesToKeep.length > 0) {
              toKeep[platform] = identitiesToKeep
            }
          } else {
            toKeep[platform] = identities
          }
        }

        return toKeep
      },
      attributes: (oldAttributes, newAttributes) =>
        MemberService.safeMerge(oldAttributes, newAttributes),
    })
  }

  async findGithub(memberId) {
    const memberIdentities = (await MemberRepository.findById(memberId, this.options)).username
    const axios = require('axios')
    // GitHub allows a maximum of 5 parameters
    const identities = Object.values(memberIdentities).flat().slice(0, 5)
    // Join the usernames for search
    const identitiesQuery = identities.join('+OR+')
    const url = `https://api.github.com/search/users?q=${identitiesQuery}`
    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN_CONFIG.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    }
    const response = await axios.get(url, { headers })
    const data = response.data.items.map((item) => ({
      username: item.login,
      avatarUrl: item.avatar_url,
      score: item.score,
      url: item.html_url,
    }))
    return data
  }

  /**
   * Given two members, add them to the toMerge fields of each other.
   * It will also update the tenant's toMerge list, removing any entry that contains
   * the pair.
   * @returns Success/Error message
   */
  async addToMerge(suggestions: IMemberMergeSuggestion[]) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    try {
      const searchSyncService = new SearchSyncService(this.options)

      await MemberRepository.addToMerge(suggestions, { ...this.options, transaction })
      await SequelizeRepository.commitTransaction(transaction)

      for (const suggestion of suggestions) {
        await searchSyncService.triggerMemberSync(
          this.options.currentTenant.id,
          suggestion.members[0],
        )
        await searchSyncService.triggerMemberSync(
          this.options.currentTenant.id,
          suggestion.members[1],
        )
      }
      return { status: 200 }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      this.log.error(error, 'Error while adding members to merge')
      throw error
    }
  }

  /**
   * Given two members, add them to the noMerge fields of each other.
   * @param memberOneId ID of the first member
   * @param memberTwoId ID of the second member
   * @returns Success/Error message
   */
  async addToNoMerge(memberOneId, memberTwoId) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const searchSyncService = new SearchSyncService(this.options)

    try {
      await MemberRepository.addNoMerge(memberOneId, memberTwoId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.addNoMerge(memberTwoId, memberOneId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.removeToMerge(memberOneId, memberTwoId, {
        ...this.options,
        transaction,
      })
      await MemberRepository.removeToMerge(memberTwoId, memberOneId, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      await searchSyncService.triggerMemberSync(this.options.currentTenant.id, memberOneId)
      await searchSyncService.triggerMemberSync(this.options.currentTenant.id, memberTwoId)

      return { status: 200 }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  async getMergeSuggestions(
    type: IMemberMergeSuggestionsType,
    numberOfHours: Number = 1.2,
  ): Promise<IMemberMergeSuggestion[]> {
    // Adding a transaction so it will use the write database
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      let out = []
      if (type === IMemberMergeSuggestionsType.USERNAME) {
        out = await MemberRepository.mergeSuggestionsByUsername(numberOfHours, {
          ...this.options,
          transaction,
        })
      }
      if (type === IMemberMergeSuggestionsType.EMAIL) {
        out = await MemberRepository.mergeSuggestionsByEmail(numberOfHours, {
          ...this.options,
          transaction,
        })
      }
      if (type === IMemberMergeSuggestionsType.SIMILARITY) {
        out = await MemberRepository.mergeSuggestionsBySimilarity(numberOfHours, {
          ...this.options,
          transaction,
        })
      }
      await SequelizeRepository.commitTransaction(transaction)
      return out
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      this.log.error(error)
      throw error
    }
  }

  async update(id, data, syncToOpensearch = true, manualChange = false) {
    let transaction
    const searchSyncService = new SearchSyncService(
      this.options,
      SERVICE === ServiceType.NODEJS_WORKER ? SyncMode.ASYNCHRONOUS : undefined,
    )

    try {
      const repoOptions = await SequelizeRepository.createTransactionalRepositoryOptions(
        this.options,
      )
      transaction = repoOptions.transaction

      if (data.activities) {
        data.activities = await ActivityRepository.filterIdsInTenant(data.activities, repoOptions)
      }
      if (data.tags) {
        data.tags = await TagRepository.filterIdsInTenant(data.tags, repoOptions)
      }
      if (data.noMerge) {
        data.noMerge = await MemberRepository.filterIdsInTenant(
          data.noMerge.filter((i) => i !== id),
          repoOptions,
        )
      }
      if (data.toMerge) {
        data.toMerge = await MemberRepository.filterIdsInTenant(
          data.toMerge.filter((i) => i !== id),
          repoOptions,
        )
      }
      if (data.username) {
        // need to filter out existing identities from the payload
        const existingIdentities = (await MemberRepository.getIdentities([id], repoOptions)).get(id)

        data.username = mapUsernameToIdentities(data.username, data.platform)

        for (const identity of existingIdentities) {
          if (identity.platform in data.username) {
            // new username has this platform - we need to check if it also has the username
            let found = false
            for (const newIdentity of data.username[identity.platform]) {
              if (newIdentity.username === identity.username) {
                found = true
                break
              }
            }

            if (found) {
              // remove from data.username
              data.username[identity.platform] = data.username[identity.platform].filter(
                (i) => i.username !== identity.username,
              )
            } else {
              data.username[identity.platform].push({ ...identity, delete: true })
            }
          } else {
            // new username doesn't have this platform - we can delete the existing identity
            data.username[identity.platform] = { ...identity, delete: true }
          }
        }
      }

      const record = await MemberRepository.update(id, data, repoOptions, true, manualChange)

      await SequelizeRepository.commitTransaction(transaction)
      await this.options.temporal.workflow.start('memberUpdate', {
        taskQueue: 'profiles',
        workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${this.options.currentTenant.id}/${id}`,
        workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
        retry: {
          maximumAttempts: 10,
        },
        args: [
          {
            member: {
              id,
            },
          },
        ],
        searchAttributes: {
          TenantId: [this.options.currentTenant.id],
        },
      })

      if (syncToOpensearch) {
        try {
          await searchSyncService.triggerMemberSync(this.options.currentTenant.id, record.id)
        } catch (emitErr) {
          this.log.error(
            emitErr,
            { tenantId: this.options.currentTenant.id, memberId: record.id },
            'Error while triggering member sync changes!',
          )
        }
      }

      return record
    } catch (error) {
      if (error.name && error.name.includes('Sequelize')) {
        this.log.error(
          error,
          {
            query: error.sql,
            errorMessage: error.original.message,
          },
          'Error during member update!',
        )
      } else {
        this.log.error(error, 'Error during member update!')
      }

      if (transaction) {
        await SequelizeRepository.rollbackTransaction(transaction)
      }

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'member')

      throw error
    }
  }

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const searchSyncService = new SearchSyncService(this.options)

    try {
      await MemberRepository.destroyBulk(
        ids,
        {
          ...this.options,
          transaction,
        },
        true,
      )

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }

    for (const id of ids) {
      await searchSyncService.triggerRemoveMember(this.options.currentTenant.id, id)
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const searchSyncService = new SearchSyncService(this.options)

    try {
      for (const id of ids) {
        await MemberRepository.destroy(
          id,
          {
            ...this.options,
            transaction,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }

    for (const id of ids) {
      await searchSyncService.triggerRemoveMember(this.options.currentTenant.id, id)
    }
  }

  async findById(id, returnPlain = true, doPopulateRelations = true, segmentId?: string) {
    return MemberRepository.findById(
      id,
      this.options,
      returnPlain,
      doPopulateRelations,
      false,
      segmentId,
    )
  }

  async findAllAutocomplete(search, limit) {
    return MemberRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountActive(
    filters: IActiveMemberFilter,
    offset: number,
    limit: number,
    orderBy: string,
    segments: string[],
  ) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows

    return MemberRepository.findAndCountActiveOpensearch(
      filters,
      limit,
      offset,
      orderBy,
      this.options,
      memberAttributeSettings,
      segments,
    )
  }

  async findAndCountAll(args) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows
    return MemberRepository.findAndCountAll(
      { ...args, attributesSettings: memberAttributeSettings },
      this.options,
    )
  }

  async findByIdOpensearch(id: string, segmentId?: string) {
    return MemberRepository.findByIdOpensearch(id, this.options, segmentId)
  }

  async queryV2(data) {
    if (await isFeatureEnabled(FeatureFlag.SEGMENTS, this.options)) {
      if (data.segments.length !== 1) {
        throw new Error400(
          `This operation can have exactly one segment. Found ${data.segments.length} segments.`,
        )
      }
    } else {
      data.segments = [(await new SegmentRepository(this.options).getDefaultSegment()).id]
    }

    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows

    return MemberRepository.findAndCountAllOpensearch(
      {
        limit: data.limit,
        offset: data.offset,
        filter: data.filter,
        orderBy: data.orderBy || undefined,
        countOnly: data.countOnly || false,
        attributesSettings: memberAttributeSettings,
        segments: data.segments,
      },
      this.options,
    )
  }

  async query(data, exportMode = false) {
    const memberAttributeSettings = (
      await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
    ).rows.filter((setting) => setting.type !== MemberAttributeType.SPECIAL)
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return MemberRepository.findAndCountAll(
      {
        advancedFilter,
        orderBy,
        limit,
        offset,
        attributesSettings: memberAttributeSettings,
        exportMode,
      },
      this.options,
    )
  }

  async queryForCsv(data) {
    const transformed = {
      filter: data.filter,
      limit: data.limit || 200,
      offset: data.offset || 0,
      orderBy: data.orderBy,
      countOnly: false,
      segments: this.options.currentSegments.map((s) => s.id) || [],
      attributesSettings: (
        await MemberAttributeSettingsRepository.findAndCountAll({}, this.options)
      ).rows,
    }

    const found = await MemberRepository.findAndCountAllOpensearch(transformed, {
      ...this.options,
      opensearch: getOpensearchClient(OPENSEARCH_CONFIG),
    })

    const relations = [
      { relation: 'organizations', attributes: ['displayName', 'website', 'logo'] },
      { relation: 'notes', attributes: ['body'] },
      { relation: 'tags', attributes: ['name'] },
    ]
    for (const relation of relations) {
      for (const member of found.rows) {
        member[relation.relation] = member[relation.relation]?.map((i) => ({
          id: i.id,
          ...lodash.pick(i, relation.attributes),
        }))
      }
    }

    return found
  }

  async export(data) {
    const emitter = await getNodejsWorkerEmitter()
    await emitter.exportCSV(
      this.options.currentTenant.id,
      this.options.currentUser.id,
      ExportableEntity.MEMBERS,
      SequelizeRepository.getSegmentIds(this.options),
      data,
    )
    return {}
  }

  async findMembersWithMergeSuggestions(args) {
    return MemberRepository.findMembersWithMergeSuggestions(args, this.options)
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.upsert(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await MemberRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }

  /**
   *
   * @param oldReach The old reach object
   * @param newReach the new reach object
   * @returns The new reach object
   */
  static calculateReach(oldReach: any, newReach: any) {
    // Totals are recomputed, so we delete them first
    delete oldReach.total
    delete newReach.total
    const out = lodash.merge(oldReach, newReach)
    if (Object.keys(out).length === 0) {
      return { total: -1 }
    }
    // Total is the sum of all attributes
    out.total = lodash.sum(Object.values(out))
    return out
  }

  /**
   * Merges two objects, preserving non-null values in the original object.
   *
   * @param originalObject - The original object
   * @param newObject - The object to merge into the original
   * @returns The merged object
   */
  static safeMerge(originalObject: any, newObject: any) {
    const mergeCustomizer = (originalValue, newValue) => {
      // Merge arrays, removing duplicates
      if (lodash.isArray(originalValue)) {
        return lodash.unionWith(originalValue, newValue, lodash.isEqual)
      }

      // Recursively merge nested objects
      if (lodash.isPlainObject(originalValue)) {
        return lodash.mergeWith({}, originalValue, newValue, mergeCustomizer)
      }

      // Preserve original non-null or non-empty values
      if (newValue === null || (originalValue !== null && originalValue !== '')) {
        return originalValue
      }

      return undefined
    }

    return lodash.mergeWith({}, originalObject, newObject, mergeCustomizer)
  }
}
