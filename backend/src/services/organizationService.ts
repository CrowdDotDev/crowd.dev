import { IOrganization, IOrganizationIdentity } from '@crowd/types'
import { LoggerBase } from '@crowd/logging'
import { websiteNormalizer } from '@crowd/common'
import { CLEARBIT_CONFIG, IS_TEST_ENV } from '../conf'
import MemberRepository from '../database/repositories/memberRepository'
import organizationCacheRepository from '../database/repositories/organizationCacheRepository'
import OrganizationRepository from '../database/repositories/organizationRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import Error400 from '../errors/Error400'
import Plans from '../security/plans'
import telemetryTrack from '../segment/telemetryTrack'
import { IServiceOptions } from './IServiceOptions'
import { enrichOrganization } from './helpers/enrichment'
import { getSearchSyncWorkerEmitter } from '@/serverless/utils/serviceSQS'
import merge from './helpers/merge'
import {
  keepPrimary,
  keepPrimaryIfExists,
  mergeUniqueStringArrayItems,
} from './helpers/mergeFunctions'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import getObjectWithoutKey from '@/utils/getObjectWithoutKey'

export default class OrganizationService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async shouldEnrich(enrichP) {
    const isPremium = this.options.currentTenant.plan === Plans.values.growth
    if (!isPremium) {
      return false
    }
    return enrichP && (CLEARBIT_CONFIG.apiKey || IS_TEST_ENV)
  }

  async merge(originalId, toMergeId) {
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
      let original = await OrganizationRepository.findById(originalId, this.options)
      let toMerge = await OrganizationRepository.findById(toMergeId, this.options)

      if (original.id === toMerge.id) {
        return {
          status: 203,
          mergedId: originalId,
        }
      }

      tx = await SequelizeRepository.createTransaction(this.options)
      const repoOptions: IRepositoryOptions = { ...this.options }
      repoOptions.transaction = tx

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

      await OrganizationRepository.moveIdentitiesBetweenOrganizations(
        toMergeId,
        originalId,
        identitiesToMove,
        repoOptions,
      )

      // remove aggregate fields and relationships
      original = removeExtraFields(original)
      toMerge = removeExtraFields(toMerge)

      // Performs a merge and returns the fields that were changed so we can update
      const toUpdate: any = await OrganizationService.organizationsMerge(original, toMerge)

      // Update original organization
      const txService = new OrganizationService(repoOptions as IServiceOptions)
      await txService.update(originalId, toUpdate, repoOptions.transaction)

      // update members that belong to source organization to destination org
      await OrganizationRepository.moveMembersBetweenOrganizations(
        toMergeId,
        originalId,
        repoOptions,
      )

      // update activities that belong to source org to destination org
      await OrganizationRepository.moveActivitiesBetweenOrganizations(
        toMergeId,
        originalId,
        repoOptions,
      )

      const secondMemberSegments = await OrganizationRepository.getOrganizationSegments(
        toMergeId,
        repoOptions,
      )

      await OrganizationRepository.includeOrganizationToSegments(originalId, {
        ...repoOptions,
        currentSegments: secondMemberSegments,
      })

      // Delete toMerge organization
      await OrganizationRepository.destroy(toMergeId, repoOptions, true)

      await SequelizeRepository.commitTransaction(tx)

      const searchSyncEmitter = await getSearchSyncWorkerEmitter()
      await searchSyncEmitter.triggerOrganizationSync(this.options.currentTenant.id, originalId)
      await searchSyncEmitter.triggerRemoveOrganization(this.options.currentTenant.id, toMergeId)

      // sync organization members
      await searchSyncEmitter.triggerOrganizationMembersSync(originalId)

      // sync organization activities
      await searchSyncEmitter.triggerOrganizationActivitiesSync(originalId)

      this.options.log.info({ originalId, toMergeId }, 'Organizations merged!')
      return { status: 200, mergedId: originalId }
    } catch (err) {
      this.options.log.error(err, 'Error while merging organizations!')
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

  async createOrUpdate(data: IOrganization, enrichP = true) {
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
      const shouldDoEnrich = await this.shouldEnrich(enrichP)

      const primaryIdentity = data.identities[0]

      // check cache existing by name
      let cache = await organizationCacheRepository.findByName(primaryIdentity.name, {
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
        data = {
          ...cache,
          ...data,
        }
        cache = await organizationCacheRepository.update(cache.id, data, {
          ...this.options,
          transaction,
        })
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

      // clearbit enrich
      if (shouldDoEnrich && !cache.enriched) {
        try {
          const enrichedData = await enrichOrganization(primaryIdentity.name)

          // overwrite cache with enriched data, but keep the name because it's serving as a unique identifier
          data = {
            ...data, // to keep uncacheable data (like identities, weakIdentities)
            ...cache,
            ...enrichedData,
            name: cache.name,
            enriched: true,
          }

          cache = await organizationCacheRepository.update(cache.id, data, {
            ...this.options,
            transaction,
          })
        } catch (error) {
          this.log.error(error, `Could not enrich ${primaryIdentity.name}!`)
        }
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
      if (data.website) {
        existing = await OrganizationRepository.findByDomain(data.website, this.options)
      } else {
        existing = await OrganizationRepository.findByIdentity(primaryIdentity, this.options)
      }

      if (existing) {
        await OrganizationRepository.checkIdentities(data, this.options, existing.id)

        record = await OrganizationRepository.update(
          existing.id,
          { ...data, ...cache },
          { ...this.options, transaction },
        )
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

      const searchSyncEmitter = await getSearchSyncWorkerEmitter()
      await searchSyncEmitter.triggerOrganizationSync(this.options.currentTenant.id, record.id)

      return await this.findById(record.id)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'organization')

      throw error
    }
  }

  async update(id, data, passedTransaction?) {
    const transaction =
      passedTransaction || (await SequelizeRepository.createTransaction(this.options))

    try {
      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      // Normalize the website URL if it exists
      if (data.website) {
        data.website = websiteNormalizer(data.website)
      }

      const originalIdentities = data.identities

      // check identities
      await OrganizationRepository.checkIdentities(data, { ...this.options, transaction }, id)

      // if we found any strong identities sent already existing in another organization
      // instead of making it a weak identity we throw an error here, because this function
      // is mainly used for doing manual updates through UI and possibly
      // we don't wanna do an auto-merge here or make strong identities sent by user as weak
      if (originalIdentities.length !== data.identities.length) {
        const alreadyExistingStrongIdentities = originalIdentities.filter(
          (oi) => !data.identities.some((di) => di.platform === oi.platform && di.name === oi.name),
        )

        throw new Error(
          `Organization identities ${JSON.stringify(
            alreadyExistingStrongIdentities,
          )} already exist in another organization!`,
        )
      }

      const record = await OrganizationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      if (!passedTransaction) {
        await SequelizeRepository.commitTransaction(transaction)
      }

      const searchSyncEmitter = await getSearchSyncWorkerEmitter()
      await searchSyncEmitter.triggerOrganizationSync(this.options.currentTenant.id, record.id)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

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

      const searchSyncEmitter = await getSearchSyncWorkerEmitter()

      for (const id of ids) {
        await searchSyncEmitter.triggerRemoveOrganization(this.options.currentTenant.id, id)
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

  async findByDomain(domain) {
    return OrganizationRepository.findByDomain(domain, this.options)
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

      const searchSyncEmitter = await getSearchSyncWorkerEmitter()
      for (const id of ids) {
        await searchSyncEmitter.triggerRemoveOrganization(this.options.currentTenant.id, id)
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
