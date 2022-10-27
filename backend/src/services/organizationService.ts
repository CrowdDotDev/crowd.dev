import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import OrganizationRepository from '../database/repositories/organizationRepository'
import MemberRepository from '../database/repositories/memberRepository'
import { CLEARBIT_CONFIG, IS_TEST_ENV } from '../config'
import organizationCacheRepository from '../database/repositories/organizationCacheRepository'
import { enrichOrganization, organizationUrlFromName } from './helpers/enrichment'

export default class OrganizationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  async shouldEnrich(enrichP) {
    const isPremium = this.options.currentTenant.plan === 'premium'
    if (!isPremium) {
      return false
    }
    return enrichP && (CLEARBIT_CONFIG.apiKey || IS_TEST_ENV)
  }

  async findOrCreate(data, enrichP = true) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      const shouldDoEnrich = await this.shouldEnrich(enrichP)

      const existingByName = data.name
        ? await OrganizationRepository.findByName(data.name, {
            ...this.options,
            transaction,
          })
        : null
      if (existingByName) {
        await SequelizeRepository.commitTransaction(transaction)
        return await this.update(existingByName.id, data)
      }

      const existingByUrl = data.url
        ? await OrganizationRepository.findByUrl(data.url, {
            ...this.options,
            transaction,
          })
        : null
      if (existingByUrl) {
        await SequelizeRepository.commitTransaction(transaction)
        return await this.update(existingByUrl.id, data)
      }

      // check cache existing by name or url
      let cacheExisting

      if (data.url) {
        cacheExisting = await organizationCacheRepository.findByUrl(data.url, {
          ...this.options,
          transaction,
        })
      } else if (data.name) {
        cacheExisting = await organizationCacheRepository.findByName(data.name, {
          ...this.options,
          transaction,
        })
      }

      // if cache exists, merge current data with cache data
      // if it doesn't exist, and data has both name and url values (That might come from github api)
      // create cache from the data
      if (cacheExisting) {
        data = {
          ...cacheExisting,
          ...data,
        }
        cacheExisting = await organizationCacheRepository.update(cacheExisting.id, data, {
          ...this.options,
          transaction,
        })
      } else if (data.name && data.url) {
        // save it to cache
          cacheExisting = await organizationCacheRepository.create(data, {
            ...this.options,
            transaction,
          })

      }

      if (shouldDoEnrich) {
        if (!data.name && !data.url) {
          throw new Error400(this.options.language, 'errors.OrganizationNameOrUrlRequired.message')
        }
        if (data.name && !data.url) {
          try {
            data.url = await organizationUrlFromName(data.name)
          } catch (error) {
            console.log(`Could not get URL for ${data.name}: ${error}`)
          }
        }
        if (data.url) {
          try {
            const enrichedData = await enrichOrganization(data.url)
            data = {
              ...data,
              ...enrichedData,
            }

            // enrichOrganization might have updated the url of the organization
            // that's why we need to check it again by url
            cacheExisting = await organizationCacheRepository.findByUrl(data.url, {
              ...this.options,
              transaction,
            })

            if (cacheExisting){
              await organizationCacheRepository.update(cacheExisting.id, data, {
                ...this.options,
                transaction,
              })
            }
            else{
              cacheExisting = await organizationCacheRepository.create(data, {
                ...this.options,
                transaction,
              })
            }

        
          } catch (error) {
            console.log(`Could not enrich ${data.url}: ${error}`)
          }
        }
      }

      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      const record = await OrganizationRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'organization')

      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    try {
      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      const record = await OrganizationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

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
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return OrganizationRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return OrganizationRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return OrganizationRepository.findAndCountAll(args, this.options)
  }

  async query(data) {
    const advancedFilter = data.filter
    const orderBy = data.orderBy
    const limit = data.limit
    const offset = data.offset
    return OrganizationRepository.findAndCountAll(
      { advancedFilter, orderBy, limit, offset },
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

    return this.findOrCreate(dataToCreate)
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
