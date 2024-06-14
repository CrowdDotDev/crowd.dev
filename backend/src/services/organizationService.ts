import { captureApiChange, organizationMergeAction } from '@crowd/audit-logs'
import { Error400, websiteNormalizer } from '@crowd/common'
import {
  findLfxMembership,
  findManyLfxMemberships,
  hasLfxMembership,
} from '@crowd/data-access-layer/src/lfx_memberships'
import { LoggerBase } from '@crowd/logging'
import {
  IOrganization,
  IOrganizationIdentity,
  IOrganizationUnmergeBackup,
  IOrganizationUnmergePreviewResult,
  ISearchSyncOptions,
  IUnmergePreviewResult,
  MemberRoleUnmergeStrategy,
  MergeActionState,
  MergeActionType,
  OrganizationIdentityType,
  SyncMode,
} from '@crowd/types'
import { randomUUID } from 'crypto'
import lodash from 'lodash'
import getObjectWithoutKey from '@/utils/getObjectWithoutKey'
import { IActiveOrganizationFilter } from '@/database/repositories/types/organizationTypes'
import MemberOrganizationRepository from '@/database/repositories/memberOrganizationRepository'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
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
    'description',
    'emails',
    'phoneNumbers',
    'logo',
    'tags',
    'type',
    'joinedAt',
    'twitter',
    'linkedin',
    'crunchbase',
    'employees',
    'revenueRange',
    'location',
    'github',
    'website',
    'isTeamOrganization',
    'employeeCountByCountry',
    'geoLocation',
    'size',
    'ticker',
    'headline',
    'profiles',
    'naics',
    'address',
    'industry',
    'founded',
    'displayName',
    'attributes',
    'affiliatedProfiles',
    'allSubsidiaries',
    'alternativeDomains',
    'alternativeNames',
    'averageEmployeeTenure',
    'averageTenureByLevel',
    'averageTenureByRole',
    'directSubsidiaries',
    'employeeChurnRate',
    'employeeCountByMonth',
    'employeeGrowthRate',
    'employeeCountByMonthByLevel',
    'employeeCountByMonthByRole',
    'gicsSector',
    'grossAdditionsByMonth',
    'grossDeparturesByMonth',
    'ultimateParent',
    'immediateParent',
    'manuallyCreated',
    'manuallyChangedFields',
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

        for (const key of OrganizationService.ORGANIZATION_MERGE_FIELDS) {
          if (!organization.manuallyChangedFields.includes(key)) {
            // handle string arrays
            if (
              key in
              [
                'names',
                'emails',
                'phoneNumbers',
                'tags',
                'profiles',
                'allSubsidiaries',
                'alternativeNames',
                'directSubsidiaries',
              ]
            ) {
              organization[key] = organization[key].filter(
                (k) => !secondaryBackup[key].some((f) => f === k),
              )
            } else if (
              primaryBackup[key] !== organization[key] &&
              secondaryBackup[key] === organization[key]
            ) {
              organization[key] = null
            }
          }
        }

        // identities
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

      return {
        primary: {
          ...lodash.pick(organization, OrganizationService.ORGANIZATION_MERGE_FIELDS),
          identities: primaryIdentities,
          memberCount: organization.memberCount - secondaryMemberCount,
          activityCount: organization.activityCount - secondaryActivityCount,
        },
        secondary: {
          id: randomUUID(),
          identities: secondaryIdentities,
          names: [identity.value],
          displayName: identity.value,
          description: null,
          activityCount: secondaryActivityCount,
          memberCount: secondaryMemberCount,
          emails: [],
          phoneNumbers: [],
          logo: null,
          tags: [],
          employees: null,
          location: null,
          isTeamOrganization: false,
          employeeCountByCountry: null,
          geoLocation: null,
          size: null,
          ticker: null,
          headline: null,
          profiles: [],
          naics: null,
          address: null,
          industry: null,
          founded: null,
          attributes: {},
          searchSyncedAt: null,
          allSubsidiaries: [],
          alternativeNames: [],
          averageEmployeeTenure: null,
          averageTenureByLevel: null,
          averageTenureByRole: null,
          directSubsidiaries: [],
          employeeChurnRate: null,
          employeeCountByMonth: {},
          employeeGrowthRate: null,
          employeeCountByMonthByLevel: {},
          employeeCountByMonthByRole: {},
          gicsSector: null,
          grossAdditionsByMonth: {},
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
      const organization = await OrganizationRepository.findById(organizationId, this.options)

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

          const memberOrganizations = await MemberOrganizationRepository.findRolesInOrganization(
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

      // update rest of the primary org fields
      await OrganizationRepository.update(
        organizationId,
        payload.primary,
        repoOptions,
        false,
        false,
      )

      // trigger entity-merging-worker to move activities in the background
      await SequelizeRepository.commitTransaction(tx)

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
              ...lodash.pick(
                await OrganizationRepository.findByIdOpensearch(
                  originalId,
                  this.options,
                  segmentId,
                ),
                OrganizationService.ORGANIZATION_MERGE_FIELDS,
              ),
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

          await MergeActionsRepository.setState(
            MergeActionType.ORG,
            originalId,
            toMergeId,
            MergeActionState.FINISHING,
            this.options,
          )

          return { original, toMerge }
        }),
      )

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Sending refresh opensearch messages! ',
      )

      const searchSyncService = new SearchSyncService(this.options, SyncMode.ASYNCHRONOUS)

      await searchSyncService.triggerOrganizationSync(tenantId, originalId)
      await searchSyncService.triggerRemoveOrganization(tenantId, toMergeId)

      // sync organization members
      await searchSyncService.triggerOrganizationMembersSync(tenantId, originalId)

      // sync organization activities
      await searchSyncService.triggerOrganizationActivitiesSync(tenantId, originalId)

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Sending refresh opensearch messages done! ',
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

      await MergeActionsRepository.setState(
        MergeActionType.ORG,
        originalId,
        toMergeId,
        MergeActionState.ERROR,
        this.options,
      )

      if (tx) {
        await SequelizeRepository.rollbackTransaction(tx)
      }

      throw err
    }
  }

  static organizationsMerge(originalObject, toMergeObject) {
    return merge(originalObject, toMergeObject, {
      description: keepPrimaryIfExists,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      names: mergeUniqueStringArrayItems,
      emails: mergeUniqueStringArrayItems,
      phoneNumbers: mergeUniqueStringArrayItems,
      logo: keepPrimaryIfExists,
      tags: mergeUniqueStringArrayItems,
      employees: keepPrimaryIfExists,
      revenueRange: keepPrimaryIfExists,
      importHash: keepPrimary,
      createdAt: keepPrimary,
      updatedAt: keepPrimary,
      deletedAt: keepPrimary,
      tenantId: keepPrimary,
      createdById: keepPrimary,
      updatedById: keepPrimary,
      location: keepPrimaryIfExists,
      isTeamOrganization: keepPrimaryIfExists,
      lastEnrichedAt: keepPrimary,
      employeeCountByCountry: keepPrimaryIfExists,
      type: keepPrimaryIfExists,
      geoLocation: keepPrimaryIfExists,
      size: keepPrimaryIfExists,
      ticker: keepPrimaryIfExists,
      headline: keepPrimaryIfExists,
      profiles: mergeUniqueStringArrayItems,
      naics: keepPrimaryIfExists,
      address: keepPrimaryIfExists,
      industry: keepPrimaryIfExists,
      founded: keepPrimaryIfExists,
      displayName: keepPrimary,
      attributes: keepPrimary,
      searchSyncedAt: keepPrimary,
      allSubsidiaries: mergeUniqueStringArrayItems,
      alternativeNames: mergeUniqueStringArrayItems,
      averageEmployeeTenure: keepPrimaryIfExists,
      averageTenureByLevel: keepPrimaryIfExists,
      averageTenureByRole: keepPrimaryIfExists,
      directSubsidiaries: mergeUniqueStringArrayItems,
      employeeChurnRate: keepPrimaryIfExists,
      employeeCountByMonth: keepPrimaryIfExists,
      employeeGrowthRate: keepPrimaryIfExists,
      employeeCountByMonthByLevel: keepPrimaryIfExists,
      employeeCountByMonthByRole: keepPrimaryIfExists,
      gicsSector: keepPrimaryIfExists,
      grossAdditionsByMonth: keepPrimaryIfExists,
      grossDeparturesByMonth: keepPrimaryIfExists,
      ultimateParent: keepPrimaryIfExists,
      immediateParent: keepPrimaryIfExists,
      manuallyCreated: keepPrimary,
    })
  }

  async addToNoMerge(organizationId: string, noMergeId: string): Promise<void> {
    const transaction = await SequelizeRepository.createTransaction(this.options)
    const searchSyncService = new SearchSyncService(this.options)

    try {
      await OrganizationRepository.addNoMerge(organizationId, noMergeId, {
        ...this.options,
        transaction,
      })
      await OrganizationRepository.removeToMerge(organizationId, noMergeId, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, organizationId)
      await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, noMergeId)
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
      const primaryIdentity = verifiedIdentities[0]
      const name = primaryIdentity.value

      if (!data.names) {
        data.names = [name]
      }

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
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      let record
      const existing = await OrganizationRepository.findByVerifiedIdentities(
        verifiedIdentities,
        this.options,
      )

      if (existing) {
        // Set displayName if it doesn't exist
        if (!existing.displayName) {
          data.displayName = name
        }

        // if it does exists update it
        const updateData: Partial<IOrganization> = {}
        const fields = [
          'displayName',
          'description',
          'names',
          'emails',
          'logo',
          'tags',
          'employees',
          'location',
          'type',
          'size',
          'headline',
          'industry',
          'founded',
          'attributes',
        ]
        fields.forEach((field) => {
          if (!existing[field] && data[field]) {
            updateData[field] = data[field]
          }
        })

        if (Object.keys(updateData).length > 0) {
          record = await OrganizationRepository.update(existing.id, updateData, {
            ...this.options,
            transaction,
          })
        } else {
          record = existing
        }

        const existingIdentities = await OrganizationRepository.getIdentities(record.id, {
          ...this.options,
          transaction,
        })

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

        if (toCreate.length > 0) {
          for (const i of toCreate) {
            // add the identity
            await OrganizationRepository.addIdentity(record.id, i, {
              ...this.options,
              transaction,
            })
          }
        }

        if (toUpdate.length > 0) {
          for (const i of toUpdate) {
            // update the identity
            await OrganizationRepository.updateIdentity(record.id, i, {
              ...this.options,
              transaction,
            })
          }
        }
      } else {
        const organization = {
          ...data, // to keep uncacheable data (like identities, weakIdentities)
          displayName: name,
        }

        record = await OrganizationRepository.create(organization, {
          ...this.options,
          transaction,
        })
        telemetryTrack(
          'Organization created',
          {
            id: record.id,
            createdAt: record.createdAt,
          },
          this.options,
        )

        for (const i of data.identities) {
          await OrganizationRepository.addIdentity(record.id, i, {
            ...this.options,
            transaction,
          })
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

      if (syncToOpensearch) {
        try {
          const searchSyncService = new SearchSyncService(this.options)

          await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, record.id)
        } catch (emitErr) {
          this.log.error(
            emitErr,
            { tenantId: this.options.currentTenant.id, organizationId: record.id },
            'Error while emitting organization sync!',
          )
        }
      }

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

      const searchSyncService = new SearchSyncService(this.options)

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
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset

    const res = await OrganizationRepository.findAndCountAllOpensearch(
      { filter: advancedFilter, orderBy, limit, offset, segments: data.segments },
      this.options,
    )

    // group orgs by id to avoid duplicates and store segmentId in a segments array
    const grouped = res.rows.reduce((acc, org) => {
      if (!acc[org.id]) {
        acc[org.id] = { ...org, segments: [org.segmentId] }
      } else {
        acc[org.id].segments.push(org.segmentId)
      }

      // drop unnecessary fields
      delete acc[org.id].grandParentSegment
      delete acc[org.id].segmentId

      return acc
    }, {})

    res.rows = Object.values(grouped)

    return res
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

  async findByUrl(url) {
    return OrganizationRepository.findByUrl(url, this.options)
  }

  async findOrCreateByDomain(domain) {
    return OrganizationRepository.findOrCreateByDomain(domain, this.options)
  }

  async findByIdOpensearch(id: string, segmentId?: string) {
    const org = await OrganizationRepository.findByIdOpensearch(id, this.options, segmentId)

    const qx = SequelizeRepository.getQueryExecutor(this.options)

    org.lfxMembership = await findLfxMembership(qx, {
      organizationId: id,
      tenantId: this.options.currentTenant.id,
    })

    return org
  }

  async query(data) {
    const { filter, orderBy, limit, offset, segments } = data
    return OrganizationRepository.findAndCountAll(
      {
        filter,
        orderBy,
        limit,
        offset,
        segments,
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
        include: { identities: true, lfxMemberships: true },
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
