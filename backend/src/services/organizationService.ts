import { Error400, websiteNormalizer } from '@crowd/common'
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
  SyncMode,
} from '@crowd/types'
import { randomUUID } from 'crypto'
import lodash from 'lodash'
import { captureApiChange, organizationMergeAction } from '@crowd/audit-logs'
import getObjectWithoutKey from '@/utils/getObjectWithoutKey'
import { IActiveOrganizationFilter } from '@/database/repositories/types/organizationTypes'
import MemberOrganizationRepository from '@/database/repositories/memberOrganizationRepository'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import MemberRepository from '../database/repositories/memberRepository'
import { MergeActionsRepository } from '../database/repositories/mergeActionsRepository'
import organizationCacheRepository from '../database/repositories/organizationCacheRepository'
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

      if (!identities.some((i) => i.platform === identity.platform && i.name === identity.name)) {
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
                'emails',
                'phoneNumbers',
                'tags',
                'profiles',
                'affiliatedProfiles',
                'allSubsidiaries',
                'alternativeDomains',
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
            !secondaryBackup.identities.some((s) => s.platform === i.platform && s.name === i.name),
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
        (i) => !secondaryIdentities.some((s) => s.platform === i.platform && s.name === i.name),
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
          displayName: identity.name,
          description: null,
          activityCount: secondaryActivityCount,
          memberCount: secondaryMemberCount,
          emails: [],
          phoneNumbers: [],
          logo: null,
          tags: [],
          twitter: null,
          linkedin: null,
          crunchbase: null,
          employees: null,
          location: null,
          website: null,
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
          affiliatedProfiles: [],
          allSubsidiaries: [],
          alternativeDomains: [],
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
        payload.secondary.identities,
        repoOptions,
      )

      // check website before creating the secondary org
      if (
        payload.secondary.website &&
        payload.secondary.website === organization.website &&
        !payload.primary.website
      ) {
        // set primary website to null before creating the secondary org
        await OrganizationRepository.update(
          organizationId,
          { website: null },
          repoOptions,
          false,
          false,
        )
      }

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

    try {
      const { original, toMerge } = await captureApiChange(
        this.options,
        organizationMergeAction(originalId, async (captureOldState, captureNewState) => {
          this.log.info('[Merge Organizations] - Finding organizations! ')
          let original = await OrganizationRepository.findById(originalId, this.options)
          let toMerge = await OrganizationRepository.findById(toMergeId, this.options)

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
          const identitiesToMove = []
          for (const identity of toMergeIdentities) {
            if (
              !originalIdentities.find(
                (i) => i.platform === identity.platform && i.name === identity.name,
              )
            ) {
              identitiesToMove.push(identity)
            }
          }

          this.log.info(
            { originalId, toMergeId },
            '[Merge Organizations] - Moving identities between organizations! ',
          )

          await OrganizationRepository.moveIdentitiesBetweenOrganizations(
            toMergeId,
            originalId,
            identitiesToMove,
            repoOptions,
          )

          // if toMerge has website - also add it as an identity to the original org
          // for identifying further organizations, and website information of toMerge is not lost
          if (toMerge.website) {
            await OrganizationRepository.addIdentity(
              originalId,
              {
                name: toMerge.website,
                platform: 'email',
                integrationId: null,
              },
              repoOptions,
            )
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

      await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, originalId)
      await searchSyncService.triggerRemoveOrganization(this.options.currentTenant.id, toMergeId)

      // sync organization members
      await searchSyncService.triggerOrganizationMembersSync(
        this.options.currentTenant.id,
        originalId,
      )

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
          this.options.currentTenant.id,
          this.options.currentUser.id,
        ],
        searchAttributes: {
          TenantId: [this.options.currentTenant.id],
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
      emails: mergeUniqueStringArrayItems,
      phoneNumbers: mergeUniqueStringArrayItems,
      logo: keepPrimaryIfExists,
      tags: mergeUniqueStringArrayItems,
      twitter: keepPrimaryIfExists,
      linkedin: keepPrimaryIfExists,
      crunchbase: keepPrimaryIfExists,
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
      github: keepPrimaryIfExists,
      website: keepPrimaryIfExists,
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
      affiliatedProfiles: mergeUniqueStringArrayItems,
      allSubsidiaries: mergeUniqueStringArrayItems,
      alternativeDomains: mergeUniqueStringArrayItems,
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
      weakIdentities: (
        weakIdentitiesPrimary: IOrganizationIdentity[],
        weakIdentitiesSecondary: IOrganizationIdentity[],
      ): IOrganizationIdentity[] => {
        const uniqueMap: { [key: string]: IOrganizationIdentity } = {}

        const createKey = (identity: IOrganizationIdentity) =>
          `${identity.platform}_${identity.name}`

        ;[...weakIdentitiesPrimary, ...weakIdentitiesSecondary].forEach((identity) => {
          const key = createKey(identity)

          if (!uniqueMap[key]) {
            uniqueMap[key] = identity
          }
        })

        return Object.values(uniqueMap)
      },
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

    if ((data as any).name && (!data.identities || data.identities.length === 0)) {
      data.identities = [
        {
          name: (data as any).name,
          platform: 'custom',
        },
      ]
      delete (data as any).name
    }

    if (
      !data.identities ||
      data.identities.length === 0 ||
      !data.identities[0].name ||
      !data.identities[0].platform
    ) {
      const message = `Missing organization identity while creating/updating organization!`
      this.log.error(data, message)
      throw new Error(message)
    }

    try {
      const primaryIdentity = data.identities[0]
      const nameToCheckInCache = (data as any).name || primaryIdentity.name

      // Normalize the website URL if it exists
      if (data.website) {
        data.website = websiteNormalizer(data.website)
      }

      // lets check if we have this organization in cache by website
      let cache
      let createCacheIdentity = false
      if (data.website) {
        cache = await organizationCacheRepository.findByWebsite(data.website, {
          ...this.options,
          transaction,
        })

        if (cache && !cache.names.includes(nameToCheckInCache)) {
          createCacheIdentity = true
        }
      }

      // check cache existing by name
      if (!cache) {
        cache = await organizationCacheRepository.findByName(nameToCheckInCache, {
          ...this.options,
          transaction,
        })
      }

      // if cache exists, merge current data with cache data
      // if it doesn't exist, create it from incoming data
      if (cache) {
        // if exists in cache update it
        const updateData: Partial<IOrganization> = {}
        const fields = [
          'url',
          'description',
          'emails',
          'logo',
          'tags',
          'github',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'location',
          'website',
          'type',
          'size',
          'headline',
          'industry',
          'founded',
        ]
        fields.forEach((field) => {
          if (data[field] && !lodash.isEqual(data[field], cache[field])) {
            updateData[field] = data[field]
          }
        })
        if (Object.keys(updateData).length > 0) {
          await organizationCacheRepository.update(
            cache.id,
            updateData,
            {
              ...this.options,
              transaction,
            },
            createCacheIdentity ? nameToCheckInCache : undefined,
          )

          cache = { ...cache, ...updateData } // Update the cached data with the new data
        }
      } else {
        // save it to cache
        cache = await organizationCacheRepository.create(
          {
            ...data,
            name: primaryIdentity.name,
          },
          {
            ...this.options,
            transaction,
          },
        )
      }

      if (data.members) {
        cache.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      let record
      let existing

      // check if organization already exists using website or primary identity
      if (cache.website) {
        existing = await OrganizationRepository.findByDomain(cache.website, this.options)

        // also check domain in identities
        if (!existing) {
          existing = await OrganizationRepository.findByIdentity(
            {
              name: websiteNormalizer(cache.website),
              platform: 'email',
            },
            this.options,
          )
        }
      }

      if (!existing) {
        existing = await OrganizationRepository.findByIdentities(data.identities, this.options)
      }

      if (existing) {
        await OrganizationRepository.checkIdentities(data, this.options, existing.id)

        // Set displayName if it doesn't exist
        if (!existing.displayName) {
          data.displayName = cache.name
        }

        // if it does exists update it
        const updateData: Partial<IOrganization> = {}
        const fields = [
          'displayName',
          'description',
          'emails',
          'logo',
          'tags',
          'github',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'location',
          'website',
          'type',
          'size',
          'headline',
          'industry',
          'founded',
          'attributes',
          'weakIdentities',
        ]
        fields.forEach((field) => {
          if (!existing[field] && cache[field]) {
            updateData[field] = cache[field]
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
      } else {
        await OrganizationRepository.checkIdentities(data, this.options)

        const organization = {
          ...data, // to keep uncacheable data (like identities, weakIdentities)
          ...cache,
          displayName: cache.name,
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
      }

      const identities = await OrganizationRepository.getIdentities(record.id, {
        ...this.options,
        transaction,
      })

      if (data.identities && data.identities.length > 0) {
        for (const identity of data.identities) {
          const identityExists = identities.find(
            (i) => i.name === identity.name && i.platform === identity.platform,
          )

          if (!identityExists) {
            // add the identity
            await OrganizationRepository.addIdentity(record.id, identity, {
              ...this.options,
              transaction,
            })
          }
        }
      }

      await organizationCacheRepository.linkCacheAndOrganization(cache.id, record.id, {
        ...this.options,
        transaction,
      })

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

      // Normalize the website URL if it exists
      if (data.website) {
        data.website = websiteNormalizer(data.website)
      }

      if (data.identities) {
        const originalIdentities = data.identities

        // check identities
        await OrganizationRepository.checkIdentities(data, repoOptions, id)

        // if we found any strong identities sent already existing in another organization
        // instead of making it a weak identity we throw an error here, because this function
        // is mainly used for doing manual updates through UI and possibly
        // we don't wanna do an auto-merge here or make strong identities sent by user as weak
        if (originalIdentities.length !== data.identities.length) {
          const alreadyExistingStrongIdentities = originalIdentities.filter(
            (oi) =>
              !data.identities.some((di) => di.platform === oi.platform && di.name === oi.name),
          )

          throw new Error(
            `Organization identities ${JSON.stringify(
              alreadyExistingStrongIdentities,
            )} already exist in another organization!`,
          )
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
    return OrganizationRepository.findByIdOpensearch(id, this.options, segmentId)
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
          'website',
          'headline',
          'identities',
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
        ],
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
