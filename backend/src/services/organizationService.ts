import { isEqual } from 'lodash'
import { websiteNormalizer } from '@crowd/common'
import { LoggerBase } from '@crowd/logging'
import {
  IOrganization,
  IOrganizationIdentity,
  ISearchSyncOptions,
  OrganizationMergeSuggestionType,
  SyncMode,
} from '@crowd/types'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import getObjectWithoutKey from '@/utils/getObjectWithoutKey'
import MemberRepository from '../database/repositories/memberRepository'
import organizationCacheRepository from '../database/repositories/organizationCacheRepository'
import OrganizationRepository from '../database/repositories/organizationRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import Error400 from '../errors/Error400'
import telemetryTrack from '../segment/telemetryTrack'
import { IServiceOptions } from './IServiceOptions'
import merge from './helpers/merge'
import {
  keepPrimary,
  keepPrimaryIfExists,
  mergeUniqueStringArrayItems,
} from './helpers/mergeFunctions'
import SearchSyncService from './searchSyncService'
import { sendOrgMergeMessage } from '../serverless/utils/nodeWorkerSQS'
import {
  MergeActionsRepository,
  MergeActionType,
  MergeActionState,
} from '../database/repositories/mergeActionsRepository'

export default class OrganizationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async mergeAsync(originalId, toMergeId) {
    const tenantId = this.options.currentTenant.id

    await MergeActionsRepository.add(MergeActionType.ORG, originalId, toMergeId, this.options)

    await sendOrgMergeMessage(tenantId, originalId, toMergeId)
  }

  async mergeSync(originalId, toMergeId) {
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
      this.log.info('[Merge Organizations] - Finding organizations! ')
      let original = await OrganizationRepository.findById(originalId, this.options)
      let toMerge = await OrganizationRepository.findById(toMergeId, this.options)

      this.log.info({ originalId, toMergeId }, '[Merge Organizations] - Found organizations! ')

      if (original.id === toMerge.id) {
        return {
          status: 203,
          mergedId: originalId,
        }
      }

      const mergeStatusChanged = await MergeActionsRepository.setState(
        MergeActionType.ORG,
        originalId,
        toMergeId,
        MergeActionState.IN_PROGRESS,
        // not using transaction here on purpose,
        // so this change is visible until we finish
        this.options,
      )
      if (!mergeStatusChanged) {
        this.log.info('[Merge Organizations] - Merging already in progress!')
        return {
          status: 203,
          mergedId: originalId,
        }
      }

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

      this.log.info({ originalId, toMergeId }, '[Merge Organizations] - Generating merge object! ')

      // Performs a merge and returns the fields that were changed so we can update
      const toUpdate: any = await OrganizationService.organizationsMerge(original, toMerge)

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
      await OrganizationRepository.moveMembersBetweenOrganizations(
        toMergeId,
        originalId,
        repoOptions,
      )

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Moving members to original organisation done! ',
      )

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Moving activities to original organisation! ',
      )
      // update activities that belong to source org to destination org
      await OrganizationRepository.moveActivitiesBetweenOrganizations(
        toMergeId,
        originalId,
        repoOptions,
      )

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Moving activities to original organisation done! ',
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

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Destroying secondary organisation! ',
      )
      // Delete toMerge organization
      await OrganizationRepository.destroy(toMergeId, repoOptions, true, false)

      await SequelizeRepository.commitTransaction(tx)

      this.log.info({ originalId, toMergeId }, '[Merge Organizations] - Transaction commited! ')

      await MergeActionsRepository.setState(
        MergeActionType.ORG,
        originalId,
        toMergeId,
        MergeActionState.DONE,
        this.options,
      )

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Sending refresh opensearch messages! ',
      )

      const searchSyncService = new SearchSyncService(this.options)

      await searchSyncService.triggerOrganizationSync(this.options.currentTenant.id, originalId)
      await searchSyncService.triggerRemoveOrganization(this.options.currentTenant.id, toMergeId)

      // sync organization members
      await searchSyncService.triggerOrganizationMembersSync(originalId)

      // sync organization activities
      await searchSyncService.triggerOrganizationActivitiesSync(originalId)

      this.log.info(
        { originalId, toMergeId },
        '[Merge Organizations] - Sending refresh opensearch messages done! ',
      )

      this.options.log.info({ originalId, toMergeId }, 'Organizations merged!')
      return { status: 200, mergedId: originalId }
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
      employeeCounByCountry: keepPrimaryIfExists,
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

  async generateMergeSuggestions(type: OrganizationMergeSuggestionType): Promise<void> {
    this.log.trace(`Generating merge suggestions for: ${this.options.currentTenant.id}`)
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (type === OrganizationMergeSuggestionType.BY_IDENTITY) {
        let mergeSuggestions
        let hasSuggestions = false

        const generator = OrganizationRepository.getMergeSuggestions({
          ...this.options,
          transaction,
        })
        do {
          mergeSuggestions = await generator.next()

          if (mergeSuggestions.value) {
            this.log.info(
              `[Organization Merge Suggestions] tenant: ${this.options.currentTenant.id}, adding ${mergeSuggestions.value.length} organizations to suggestions!`,
            )
            hasSuggestions = true
          } else if (!hasSuggestions) {
            this.log.info(
              `[Organization Merge Suggestions] tenant: ${this.options.currentTenant.id} doesn't have any merge suggestions`,
            )
          } else {
            this.log.info(
              `[Organization Merge Suggestions] tenant: ${this.options.currentTenant.id} Finished going tru all suggestions!`,
            )
          }

          if (mergeSuggestions.value && mergeSuggestions.value.length > 0) {
            await OrganizationRepository.addToMerge(mergeSuggestions.value, this.options)
          }
        } while (!mergeSuggestions.done)
      }
      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      this.log.error(error)
      throw error
    }
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

      // check cache existing by name
      let cache = await organizationCacheRepository.findByName(nameToCheckInCache, {
        ...this.options,
        transaction,
      })

      // Normalize the website URL if it exists
      if (data.website) {
        data.website = websiteNormalizer(data.website)
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
          if (data[field] && !isEqual(data[field], cache[field])) {
            updateData[field] = data[field]
          }
        })
        if (Object.keys(updateData).length > 0) {
          await organizationCacheRepository.update(cache.id, updateData, {
            ...this.options,
            transaction,
          })

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
        existing = await OrganizationRepository.findByIdentity(primaryIdentity, this.options)
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
          if (field === 'website' && !existing.website && cache.website) {
            updateData[field] = cache[field]
          } else if (
            field !== 'website' &&
            cache[field] &&
            !isEqual(cache[field], existing[field])
          ) {
            updateData[field] = cache[field]
          }
        })

        record = await OrganizationRepository.update(existing.id, updateData, {
          ...this.options,
          transaction,
        })
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

  async update(id, data, overrideIdentities = false, syncToOpensearch = true) {
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

      const record = await OrganizationRepository.update(id, data, repoOptions, overrideIdentities)

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

  async findAllAutocomplete(search, limit) {
    return OrganizationRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return OrganizationRepository.findAndCountAll(args, this.options)
  }

  async findByUrl(url) {
    return OrganizationRepository.findByUrl(url, this.options)
  }

  async findOrCreateByDomain(domain) {
    return OrganizationRepository.findOrCreateByDomain(domain, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return OrganizationRepository.findAndCountAllOpensearch(
      { filter: advancedFilter, orderBy, limit, offset, segments: data.segments },
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
