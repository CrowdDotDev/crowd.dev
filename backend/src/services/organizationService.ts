import { randomUUID } from 'crypto'
import lodash from 'lodash'

import {
  captureApiChange,
  organizationMergeAction,
  organizationUnmergeAction,
} from '@crowd/audit-logs'
import { Error400, websiteNormalizer } from '@crowd/common'
import { hasLfxMembership } from '@crowd/data-access-layer/src/lfx_memberships'
import { findOrgAttributes, upsertOrgIdentities } from '@crowd/data-access-layer/src/organizations'
import { LoggerBase } from '@crowd/logging'
import { WorkflowIdReusePolicy } from '@crowd/temporal'
import {
  IOrganization,
  IOrganizationIdentity,
  IOrganizationUnmergeBackup,
  IOrganizationUnmergePreviewResult,
  ISearchSyncOptions,
  IUnmergePreviewResult,
  MemberRoleUnmergeStrategy,
  MergeActionState,
  MergeActionStep,
  MergeActionType,
  OrganizationIdentityType,
  SyncMode,
  TemporalWorkflowId,
} from '@crowd/types'

import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import MemberOrganizationRepository from '@/database/repositories/memberOrganizationRepository'
import { IActiveOrganizationFilter } from '@/database/repositories/types/organizationTypes'
import getObjectWithoutKey from '@/utils/getObjectWithoutKey'

import MemberRepository from '../database/repositories/memberRepository'
import { MergeActionsRepository } from '../database/repositories/mergeActionsRepository'
import OrganizationRepository from '../database/repositories/organizationRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import telemetryTrack from '../segment/telemetryTrack'

import { IServiceOptions } from './IServiceOptions'
import merge from './helpers/merge'
import {
  keepPrimary,
  keepPrimaryIfExists,
  mergeUniqueStringArrayItems,
} from './helpers/mergeFunctions'
import MemberOrganizationService from './memberOrganizationService'
import SearchSyncService from './searchSyncService'

export default class OrganizationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  static ORGANIZATION_MERGE_FIELDS = [
    'displayName',
    'description',
    'logo',
    'headline',

    'joinedAt',
    'isTeamOrganization',
    'manuallyCreated',

    'activityCount',
    'memberCount',
  ]

  async unmergePreview(
    organizationId: string,
    identity: IOrganizationIdentity,
  ): Promise<IUnmergePreviewResult<IOrganizationUnmergePreviewResult>> {
    try {
      const organization = await OrganizationRepository.findById(organizationId, this.options)

      const identities = await OrganizationRepository.getIdentities([organizationId], this.options)

      const qx = SequelizeRepository.getQueryExecutor(this.options)
      const attributes = OrganizationRepository.convertOrgAttributesForDisplay(
        await findOrgAttributes(qx, organization.id),
      )

      if (
        !identities.some(
          (i) =>
            i.platform === identity.platform &&
            i.value === identity.value &&
            i.type === identity.type &&
            i.verified === identity.verified,
        )
      ) {
        throw new Error(`Organization doesn't have the identity sent to be unmerged!`)
      }

      organization.identities = identities

      const mergeAction = await MergeActionsRepository.findMergeBackup(
        organizationId,
        MergeActionType.ORG,
        identity,
        this.options,
      )

      if (mergeAction) {
        const primaryBackup = mergeAction.unmergeBackup.primary as IOrganizationUnmergeBackup
        const secondaryBackup = mergeAction.unmergeBackup.secondary as IOrganizationUnmergeBackup

        // Construct primary organization with best effort
        for (const key of OrganizationService.ORGANIZATION_MERGE_FIELDS) {
          if (
            primaryBackup[key] !== organization[key] &&
            secondaryBackup[key] === organization[key]
          ) {
            organization[key] = primaryBackup[key] || null
          }
        }

        // Remove identities coming from secondary backup
        organization.identities = organization.identities.filter(
          (i) =>
            !secondaryBackup.identities.some(
              (s) =>
                s.platform === i.platform &&
                s.value === i.value &&
                s.type === i.type &&
                s.verified === i.verified,
            ),
        )

        return {
          mergeActionId: mergeAction.id,
          primary: {
            ...lodash.pick(organization, OrganizationService.ORGANIZATION_MERGE_FIELDS),
            identities: organization.identities,
            attributes,
            activityCount: primaryBackup.activityCount,
            memberCount: primaryBackup.memberCount,
          },
          secondary: secondaryBackup,
        }
      }

      // merge action not found, preview an identity extraction instead
      const secondaryIdentities = [identity]
      const primaryIdentities = organization.identities.filter(
        (i) =>
          !secondaryIdentities.some(
            (s) =>
              s.platform === i.platform &&
              s.value === i.value &&
              s.type === i.type &&
              s.verified === i.verified,
          ),
      )

      if (primaryIdentities.length === 0) {
        throw new Error(`Original organization only has one identity, cannot extract it!`)
      }

      let secondaryMemberCount: number
      let secondaryActivityCount: number

      // we can deduce the activity count and member count if primary member doesn't have an identity with same platform as extracted identity
      if (primaryIdentities.some((i) => i.platform === identity.platform)) {
        secondaryActivityCount = 0
        secondaryMemberCount = 0
      } else {
        // find activity count & member count by using activity platform
        secondaryActivityCount = await OrganizationRepository.getActivityCountInPlatform(
          organizationId,
          identity.platform,
          this.options,
        )
        secondaryMemberCount = await OrganizationRepository.getMemberCountInPlatform(
          organizationId,
          identity.platform,
          this.options,
        )
      }

      // clean up linkedin identity value
      if (identity.platform === 'linkedin') {
        identity.value = identity.value.split(':').pop()
      }

      return {
        primary: {
          ...lodash.pick(organization, OrganizationService.ORGANIZATION_MERGE_FIELDS),
          identities: primaryIdentities,
          attributes,
          memberCount: organization.memberCount - secondaryMemberCount,
          activityCount: organization.activityCount - secondaryActivityCount,
        },
        secondary: {
          id: randomUUID(),
          identities: secondaryIdentities,
          displayName: identity.value,
          attributes: {
            name: {
              default: identity.value,
              custom: [identity.value],
            },
          },
          activityCount: secondaryActivityCount,
          memberCount: secondaryMemberCount,
          isTeamOrganization: false,
        },
      }
    } catch (err) {
      this.options.log.error(err, 'Error while generating unmerge/identity extraction preview!')
      throw err
    }
  }

  async unmerge(
    organizationId: string,
    payload: IUnmergePreviewResult<IOrganizationUnmergePreviewResult>,
  ): Promise<void> {
    let tx

    try {
      const { organization, secondaryOrganization } = await captureApiChange(
        this.options,
        organizationUnmergeAction(organizationId, async (captureOldState, captureNewState) => {
          const organization = await OrganizationRepository.findById(organizationId, this.options)

          captureOldState({
            primary: organization,
          })

          const repoOptions: IRepositoryOptions =
            await SequelizeRepository.createTransactionalRepositoryOptions(this.options)
          tx = repoOptions.transaction

          // remove identities in secondary organization from primary
          await OrganizationRepository.removeIdentitiesFromOrganization(
            organizationId,
            payload.secondary.identities.filter(
              (i) =>
                i.verified === undefined || // backwards compatibility for old identity backups
                i.verified === true ||
                (i.verified === false &&
                  !payload.primary.identities.some(
                    (pi) =>
                      pi.verified === false &&
                      pi.platform === i.platform &&
                      pi.value === i.value &&
                      pi.type === i.type,
                  )),
            ),
            repoOptions,
          )

          // create the secondary org
          const secondaryOrganization = await OrganizationRepository.create(
            payload.secondary,
            repoOptions,
          )

          await MergeActionsRepository.add(
            MergeActionType.ORG,
            organizationId,
            secondaryOrganization.id,
            this.options,
            MergeActionStep.UNMERGE_STARTED,
            MergeActionState.IN_PROGRESS,
          )

          if (payload.mergeActionId) {
            const mergeAction = await MergeActionsRepository.findById(
              payload.mergeActionId,
              this.options,
            )

            if (mergeAction.unmergeBackup.secondary.memberOrganizations.length > 0) {
              for (const role of mergeAction.unmergeBackup.secondary.memberOrganizations) {
                await MemberOrganizationRepository.addMemberRole(
                  { ...role, organizationId: secondaryOrganization.id },
                  repoOptions,
                )
              }

              const memberOrganizations =
                await MemberOrganizationRepository.findRolesInOrganization(
                  organization.id,
                  repoOptions,
                )

              const primaryUnmergedRoles = await MemberOrganizationService.unmergeRoles(
                memberOrganizations,
                mergeAction.unmergeBackup.primary.memberOrganizations,
                mergeAction.unmergeBackup.secondary.memberOrganizations,
                MemberRoleUnmergeStrategy.SAME_ORGANIZATION,
              )

              // check if anything to delete in primary
              const rolesToDelete = memberOrganizations.filter(
                (r) =>
                  r.source !== 'ui' &&
                  !primaryUnmergedRoles.some(
                    (pr) =>
                      pr.memberId === r.memberId &&
                      pr.title === r.title &&
                      pr.dateStart === r.dateStart &&
                      pr.dateEnd === r.dateEnd,
                  ),
              )

              for (const role of rolesToDelete) {
                await MemberOrganizationRepository.removeMemberRole(role, repoOptions)
              }
            }
          }

          // delete identity related stuff, we already moved these
          delete payload.primary.identities

          captureNewState({
            primary: payload.primary,
            secondary: secondaryOrganization,
          })

          // update rest of the primary org fields
          await OrganizationRepository.update(
            organizationId,
            payload.primary,
            repoOptions,
            false,
            false,
          )

          // add primary and secondary to no merge so they don't get suggested again
          await OrganizationRepository.addNoMerge(
            organizationId,
            secondaryOrganization.id,
            repoOptions,
          )

          // trigger entity-merging-worker to move activities in the background
          await SequelizeRepository.commitTransaction(tx)

          return { organization, secondaryOrganization }
        }),
      )

      await MergeActionsRepository.setMergeAction(
        MergeActionType.ORG,
        organizationId,
        secondaryOrganization.id,
        this.options,
        {
          step: MergeActionStep.UNMERGE_SYNC_DONE,
        },
      )

      // responsible for moving organization's activities, syncing to opensearch afterwards, recalculating activity.organizationIds and notifying frontend via websockets
      await this.options.temporal.workflow.start('finishOrganizationUnmerging', {
        taskQueue: 'entity-merging',
        workflowId: `finishOrganizationUnmerging/${organization.id}/${secondaryOrganization.id}`,
        retry: {
          maximumAttempts: 10,
        },
        args: [
          organization.id,
          secondaryOrganization.id,
          organization.displayName,
          secondaryOrganization.displayName,
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

  async mergeSync(originalId: string, toMergeId: string, segmentId?: string) {
    this.options.log.info({ originalId, toMergeId }, 'Merging organizations!')

    const removeExtraFields = (organization: IOrganization): IOrganization =>
      getObjectWithoutKey(organization, [
        'activityCount',
        'memberCount',
        'activeOn',
        'segments',
        'lastActive',
        'joinedAt',
        'identities',
      ])

    let tx
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const tenantId = this.options.currentTenant.id

    try {
      const { original, toMerge } = await captureApiChange(
        this.options,
        organizationMergeAction(originalId, async (captureOldState, captureNewState) => {
          this.log.info('[Merge Organizations] - Finding organizations! ')
          let original = await OrganizationRepository.findById(originalId, this.options, segmentId)
          let toMerge = await OrganizationRepository.findById(toMergeId, this.options, segmentId)

          const originalWithLfxMembership = await hasLfxMembership(qx, {
            tenantId,
            organizationId: originalId,
          })
          const toMergeWithLfxMembership = await hasLfxMembership(qx, {
            tenantId,
            organizationId: toMergeId,
          })

          if (originalWithLfxMembership && toMergeWithLfxMembership) {
            await OrganizationRepository.addNoMerge(originalId, toMergeId, this.options)
            this.log.info(
              { originalId, toMergeId },
              '[Merge Organizations] - Skipping merge of two LFX membership orgs! ',
            )

            return {
              status: 203,
              mergedId: originalId,
            }
          }
          if (toMergeWithLfxMembership) {
            throw new Error('Cannot merge LFX membership organization as a secondary one!')
          }

          this.log.info({ originalId, toMergeId }, '[Merge Organizations] - Found organizations! ')

          captureOldState({
            primary: original,
            secondary: toMerge,
          })

          const backup = {
            primary: {
              ...lodash.pick(original, OrganizationService.ORGANIZATION_MERGE_FIELDS),
              identities: await OrganizationRepository.getIdentities([originalId], this.options),
              memberOrganizations: await MemberOrganizationRepository.findRolesInOrganization(
                originalId,
                this.options,
              ),
            },
            secondary: {
              ...lodash.pick(toMerge, OrganizationService.ORGANIZATION_MERGE_FIELDS),
              identities: await OrganizationRepository.getIdentities([toMergeId], this.options),
              memberOrganizations: await MemberOrganizationRepository.findRolesInOrganization(
                toMergeId,
                this.options,
              ),
            },
          }

          if (original.id === toMerge.id) {
            return {
              status: 203,
              mergedId: originalId,
            }
          }

          await MergeActionsRepository.add(
            MergeActionType.ORG,
            originalId,
            toMergeId,
            // not using transaction here on purpose,
            // so this change is visible until we finish
            this.options,
            MergeActionStep.MERGE_STARTED,
            MergeActionState.IN_PROGRESS,
            backup,
          )

          const repoOptions: IRepositoryOptions =
            await SequelizeRepository.createTransactionalRepositoryOptions(this.options)
          tx = repoOptions.transaction

          const allIdentities = await OrganizationRepository.getIdentities(
            [originalId, toMergeId],
            repoOptions,
          )

          const originalIdentities = allIdentities.filter((i) => i.organizationId === originalId)
          const toMergeIdentities = allIdentities.filter((i) => i.organizationId === toMergeId)
          const identitiesToMove: IOrganizationIdentity[] = []
          const identitiesToUpdate: IOrganizationIdentity[] = []

          for (const identity of toMergeIdentities) {
            const existing = originalIdentities.find(
              (i) =>
                i.platform === identity.platform &&
                i.type === identity.type &&
                i.value === identity.value,
            )

            if (!existing) {
              identitiesToMove.push(identity)
            } else if (!existing.verified && identity.verified) {
              identitiesToUpdate.push(identity)
            }
          }

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Moving identities between organizations! ',
          )

          // move non existing identities
          await OrganizationRepository.moveIdentitiesBetweenOrganizations(
            toMergeId,
            originalId,
            identitiesToMove,
            repoOptions,
          )

          // remove identities from secondary that we gonna verify in primary
          await OrganizationRepository.removeIdentitiesFromOrganization(
            toMergeId,
            identitiesToUpdate,
            repoOptions,
          )

          // verify existing unverified identities
          for (const identity of identitiesToUpdate) {
            await OrganizationRepository.updateIdentity(originalId, identity, repoOptions)
          }

          // remove aggregate fields and relationships
          original = removeExtraFields(original)
          toMerge = removeExtraFields(toMerge)

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Generating merge object! ',
          )

          // Performs a merge and returns the fields that were changed so we can update
          const toUpdate: any = await OrganizationService.organizationsMerge(original, toMerge)

          captureNewState({ primary: toUpdate })

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Generating merge object done! ',
          )

          const txService = new OrganizationService(repoOptions as IServiceOptions)

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Updating original organisation! ',
          )

          // check if website is being updated, if yes we need to set toMerge.website to null before doing the update
          // because of website unique constraint
          if (toUpdate.website && toUpdate.website === toMerge.website) {
            await txService.update(toMergeId, { website: null }, false, false)
          }

          // Update original organization
          await txService.update(originalId, toUpdate, false, false)

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Updating original organisation done! ',
          )

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Moving members to original organisation! ',
          )

          // update members that belong to source organization to destination org
          const memberOrganizationService = new MemberOrganizationService(repoOptions)
          await memberOrganizationService.moveMembersBetweenOrganizations(toMergeId, originalId)

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Moving members to original organisation done! ',
          )

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Including original organisation into secondary organisation segments! ',
          )

          const secondMemberSegments = await OrganizationRepository.getOrganizationSegments(
            toMergeId,
            repoOptions,
          )

          if (secondMemberSegments.length > 0) {
            await OrganizationRepository.includeOrganizationToSegments(originalId, {
              ...repoOptions,
              currentSegments: secondMemberSegments,
            })
          }

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Including original organisation into secondary organisation segments done! ',
          )

          await SequelizeRepository.commitTransaction(tx)

          this.log.info({ originalId, toMergeId }, '[Merge Organizations] - Transaction commited! ')

          await MergeActionsRepository.setMergeAction(
            MergeActionType.ORG,
            originalId,
            toMergeId,
            this.options,
            {
              step: MergeActionStep.MERGE_SYNC_DONE,
            },
          )

          return { original, toMerge }
        }),
      )

      await this.options.temporal.workflow.start('finishOrganizationMerging', {
        taskQueue: 'entity-merging',
        workflowId: `finishOrganizationMerging/${originalId}/${toMergeId}`,
        retry: {
          maximumAttempts: 10,
        },
        args: [
          originalId,
          toMergeId,
          original.displayName,
          toMerge.displayName,
          tenantId,
          this.options.currentUser.id,
        ],
        searchAttributes: {
          TenantId: [tenantId],
        },
      })

      this.options.log.info({ originalId, toMergeId }, 'Organizations merged!')
      return {
        status: 200,
        mergedId: originalId,
      }
    } catch (err) {
      this.options.log.error(err, 'Error while merging organizations!', {
        originalId,
        toMergeId,
      })

      await MergeActionsRepository.setMergeAction(
        MergeActionType.ORG,
        originalId,
        toMergeId,
        this.options,
        {
          state: MergeActionState.ERROR,
        },
      )

      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw err
    }
  }

  static organizationsMerge(originalObject, toMergeObject) {
    return merge(originalObject, toMergeObject, {
      importHash: keepPrimary,
      createdAt: keepPrimary,
      updatedAt: keepPrimary,
      deletedAt: keepPrimary,
      tenantId: keepPrimary,
      createdById: keepPrimary,
      updatedById: keepPrimary,
      isTeamOrganization: keepPrimaryIfExists,
      lastEnrichedAt: keepPrimary,
      searchSyncedAt: keepPrimary,
      manuallyCreated: keepPrimary,

      // default attributes
      description: keepPrimaryIfExists,
      logo: keepPrimaryIfExists,
      tags: mergeUniqueStringArrayItems,
      employees: keepPrimaryIfExists,
      revenueRange: keepPrimaryIfExists,
      location: keepPrimaryIfExists,
      type: keepPrimaryIfExists,
      size: keepPrimaryIfExists,
      headline: keepPrimaryIfExists,
      industry: keepPrimaryIfExists,
      founded: keepPrimaryIfExists,
      displayName: keepPrimary,
      employeeChurnRate: keepPrimaryIfExists,
      employeeGrowthRate: keepPrimaryIfExists,
    })
  }

  async addToNoMerge(organizationId: string, noMergeId: string): Promise<void> {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await OrganizationRepository.addNoMerge(organizationId, noMergeId, {
        ...this.options,
        transaction,
      })
      await OrganizationRepository.addNoMerge(noMergeId, organizationId, {
        ...this.options,
        transaction,
      })
      await OrganizationRepository.removeToMerge(organizationId, noMergeId, {
        ...this.options,
        transaction,
      })
      await OrganizationRepository.removeToMerge(noMergeId, organizationId, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      throw error
    }
  }

  async createOrUpdate(
    data: IOrganization,
    syncOptions: ISearchSyncOptions = { doSync: true, mode: SyncMode.USE_FEATURE_FLAG },
  ) {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const txOptions = { ...this.options, transaction }
    const tenantId = this.options.currentTenant.id

    if (!data.identities) {
      data.identities = []
    }

    if ((data as any).name && data.identities.length === 0) {
      data.identities = [
        {
          value: (data as any).name,
          type: OrganizationIdentityType.USERNAME,
          platform: 'custom',
          verified: true,
        },
      ]
      delete (data as any).name
    }

    const verifiedIdentities = data.identities.filter((i) => i.verified)

    if (verifiedIdentities.length === 0) {
      const message = `Missing organization identity while creating/updating organization!`
      this.log.error(data, message)
      throw new Error(message)
    }

    try {
      // Normalize the website identities
      for (const i of data.identities.filter((i) =>
        [
          OrganizationIdentityType.PRIMARY_DOMAIN,
          OrganizationIdentityType.ALTERNATIVE_DOMAIN,
        ].includes(i.type),
      )) {
        i.value = websiteNormalizer(i.value)
      }

      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, txOptions)
      }

      let record
      const existing = await OrganizationRepository.findByVerifiedIdentities(
        verifiedIdentities,
        txOptions,
      )

      const qx = SequelizeRepository.getQueryExecutor(txOptions, transaction)

      if (existing) {
        record = existing

        if (record.attributes) {
          const defaultColumns = await OrganizationRepository.updateOrgAttributes(
            record.id,
            record,
            txOptions,
          )

          if (Object.keys(defaultColumns).length > 0) {
            record = await OrganizationRepository.update(existing.id, defaultColumns, txOptions)
          }
        }

        await upsertOrgIdentities(qx, record.id, tenantId, data.identities)
      } else {
        record = await OrganizationRepository.create(data, txOptions)
        telemetryTrack(
          'Organization created',
          {
            id: record.id,
            createdAt: record.createdAt,
          },
          txOptions,
        )

        for (const i of data.identities) {
          await OrganizationRepository.addIdentity(record.id, i, txOptions)
        }

        if (data.attributes) {
          const defaultColumns = await OrganizationRepository.updateOrgAttributes(
            record.id,
            data,
            txOptions,
          )

          if (Object.keys(defaultColumns).length > 0) {
            record = await OrganizationRepository.update(record.id, defaultColumns, txOptions)
          }
        }
      }

      await SequelizeRepository.commitTransaction(transaction)

      if (syncOptions.doSync) {
        const searchSyncService = new SearchSyncService(this.options, syncOptions.mode)
        await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, record.id)
      }

      return await this.findById(record.id)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'organization')

      throw error
    }
  }

  async findOrganizationsWithMergeSuggestions(args) {
    return OrganizationRepository.findOrganizationsWithMergeSuggestions(args, this.options)
  }

  async update(
    id,
    data,
    overrideIdentities = false,
    syncToOpensearch = true,
    manualChange = false,
  ) {
    let tx

    try {
      const repoOptions = await SequelizeRepository.createTransactionalRepositoryOptions(
        this.options,
      )
      tx = repoOptions.transaction

      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, repoOptions)
      }

      if (data.identities) {
        // Normalize the website identities
        for (const i of data.identities.filter((i) =>
          [
            OrganizationIdentityType.PRIMARY_DOMAIN,
            OrganizationIdentityType.ALTERNATIVE_DOMAIN,
          ].includes(i.type),
        )) {
          i.value = websiteNormalizer(i.value)
        }

        const existingIdentities = await OrganizationRepository.getIdentities(id, repoOptions)

        const toUpdate: IOrganizationIdentity[] = []
        const toCreate: IOrganizationIdentity[] = []

        for (const i of data.identities) {
          const existing = existingIdentities.find(
            (ei) => ei.value === i.value && ei.platform === i.platform && ei.type === i.type,
          )
          if (!existing) {
            toCreate.push(i)
          } else if (existing && existing.verified !== i.verified) {
            toUpdate.push(i)
          }
        }

        const toUpdateVerified = toUpdate.filter((i) => i.verified)
        const verified = toUpdateVerified.concat(toCreate)
        if (verified.length > 0) {
          const existing = await OrganizationRepository.findByVerifiedIdentities(
            verified,
            repoOptions,
          )
          if (existing && existing.id !== id) {
            throw new Error(
              `Organization identities ${JSON.stringify(
                verified,
              )} already exist in another organization!`,
            )
          }
        }

        if (toCreate.length > 0) {
          for (const i of toCreate) {
            // add the identity
            await OrganizationRepository.addIdentity(id, i, repoOptions)
          }
        }

        if (toUpdate.length > 0) {
          for (const i of toUpdate) {
            // update the identity
            await OrganizationRepository.updateIdentity(id, i, repoOptions)
          }
        }
      }

      const record = await OrganizationRepository.update(
        id,
        data,
        repoOptions,
        overrideIdentities,
        manualChange,
      )

      await SequelizeRepository.commitTransaction(tx)

      await this.options.temporal.workflow.start('organizationUpdate', {
        taskQueue: 'profiles',
        workflowId: `${TemporalWorkflowId.ORGANIZATION_UPDATE}/${this.options.currentTenant.id}/${id}`,
        workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
        retry: {
          maximumAttempts: 10,
        },
        args: [
          {
            organization: {
              id: record.id,
            },
            recalculateAffiliations: false,
            syncOptions: {
              doSync: syncToOpensearch,
              withAggs: false,
            },
          },
        ],
        searchAttributes: {
          TenantId: [this.options.currentTenant.id],
        },
      })

      return record
    } catch (error) {
      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'organization')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      for (const id of ids) {
        await OrganizationRepository.destroy(
          id,
          {
            ...this.options,
            transaction,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)

      const searchSyncService = new SearchSyncService(this.options, SyncMode.ASYNCHRONOUS)

      for (const id of ids) {
        await searchSyncService.triggerRemoveOrganization(this.options.currentTenant.id, id)
      }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id: string, segmentId?: string) {
    return OrganizationRepository.findById(id, this.options, segmentId)
  }

  async findAllAutocomplete(data) {
    const { filter, orderBy, limit, offset, segments } = data
    return OrganizationRepository.findAndCountAll(
      {
        filter,
        orderBy,
        limit,
        offset,
        segmentId: segments.length > 0 ? segments[0] : undefined,
        fields: ['id', 'segmentId', 'displayName', 'memberCount', 'activityCount', 'logo'],
        include: { aggregates: true, identities: false, lfxMemberships: true },
      },
      this.options,
    )
  }

  async findAndCountAll(args) {
    return OrganizationRepository.findAndCountAll(args, this.options)
  }

  async findByIds(ids: string[]) {
    return OrganizationRepository.findByIds(ids, this.options)
  }

  async findAndCountActive(
    filters: IActiveOrganizationFilter,
    offset: number,
    limit: number,
    orderBy: string,
    segments: string[],
  ) {
    return OrganizationRepository.findAndCountActiveOpensearch(
      filters,
      limit,
      offset,
      orderBy,
      this.options,
      segments,
    )
  }

  async query(data) {
    const { filter, orderBy, limit, offset, segments } = data
    return OrganizationRepository.findAndCountAll(
      {
        filter,
        orderBy,
        limit,
        offset,
        segmentId: segments.length > 0 ? segments[0] : undefined,
        fields: [
          'id',
          'segmentId',
          'displayName',
          'headline',
          'memberCount',
          'activityCount',
          'lastActive',
          'joinedAt',
          'location',
          'industry',
          'size',
          'revenueRange',
          'founded',
          'employeeGrowthRate',
          'tags',
          'logo',
        ],
        include: { aggregates: true, identities: true, lfxMemberships: true },
      },
      this.options,
    )
  }

  async listOrganizationsAcrossAllSegments(args) {
    const { filter, orderBy, limit, offset } = args
    return OrganizationRepository.findAndCountAll(
      {
        filter,
        orderBy,
        limit,
        offset,
        segmentId: undefined,
        fields: ['id', 'logo', 'displayName', 'isTeamOrganization'],
        include: { aggregates: true, identities: true, segments: true, lfxMemberships: true },
      },
      this.options,
    )
  }

  async destroyBulk(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      await OrganizationRepository.destroyBulk(
        ids,
        {
          ...this.options,
          transaction,
        },
        true,
      )

      await SequelizeRepository.commitTransaction(transaction)

      const searchSyncService = new SearchSyncService(this.options)

      for (const id of ids) {
        await searchSyncService.triggerRemoveOrganization(this.options.currentTenant.id, id)
      }
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
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

    return this.createOrUpdate(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await OrganizationRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }
}
