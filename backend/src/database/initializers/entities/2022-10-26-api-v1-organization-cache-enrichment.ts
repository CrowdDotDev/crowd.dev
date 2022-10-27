import { QueryTypes } from 'sequelize'
import TenantService from '../../../services/tenantService'
import ActivityService from '../../../services/activityService'
import getUserContext from '../../utils/getUserContext'
import SequelizeRepository from '../../repositories/sequelizeRepository'
import { PlatformType } from '../../../types/integrationEnums'
import { GithubActivityType } from '../../../types/activityTypes'
import IntegrationRepository from '../../repositories/integrationRepository'
import getOrganization from '../../../serverless/integrations/usecases/github/graphql/organizations'
import OrganizationCacheRepository from '../../repositories/organizationCacheRepository'
import OrganizationRepository from '../../repositories/organizationRepository'

export default async () => {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  console.time('whole-script-time')

  // const tenants = await TenantService._findAndCountAllForEveryUser({})

  const tenantsQuery = `select * from tenants`

  const tenants = await options.database.sequelize.query(tenantsQuery, {
    type: QueryTypes.SELECT,
  })

  // for each tenant
  for (const tenant of tenants) {
    console.log(`processing organizations of ${tenant.id}`)
    const userContext = await getUserContext(tenant.id)

    const ghIntegration = await userContext.database.integration.findOne({
      where: {
        platform: 'github',
        tenantId: tenant.id,
      },
      include: [],
    })

    if (ghIntegration) {
      const organizationQuery = `select * from organizations o where o."tenantId"  = :tenantId`

      const organizations = await userContext.database.sequelize.query(organizationQuery, {
        type: QueryTypes.SELECT,
        replacements: {
          tenantId: tenant.id,
        },
      })

      const alreadyCheckedOrganizations = []

      for (const org of organizations) {
        console.log(org.name)

        // check if organization already exists in the cache by name
        const record = await userContext.database.organizationCache.findOne({
          where: {
            name: org.name,
          },
          include: [],
        })

        org.name = org.name.replace(/["\\]+/g, '')

        // organization is not enriched from gh api yet
        if (!record && !alreadyCheckedOrganizations.includes(org.name)) {
          const orgFromGH = await getOrganization(org.name, ghIntegration.token)
          alreadyCheckedOrganizations.push(org.name)

          if (orgFromGH) {
            console.log('orgFromGH')
            console.log(orgFromGH)
            // create cache and update organization

            console.log('org id: ')
            console.log(org.id)

            // check org by url already exists
            // let findByUrl =  await options.database.organization.findAll({
            //                   attributes: ['id', 'name'],
            //                   where: {
            //                     url: orgFromGH.url,
            //                     tenantId: tenant.id
            //                   },
            //                 })
            // findByUrl = findByUrl.filter( (i) => i.id !== org.id)
            // let findByName = await options.database.organization.findAll({
            //   attributes: ['id', 'name'],
            //   where: {
            //     name: orgFromGH.name,
            //     tenantId: tenant.id
            //   },
            // })
            // findByName = findByName.filter( (i) => i.id !== org.id)

            // check cache
            const checkCache = await OrganizationCacheRepository.findByUrl(
              orgFromGH.url,
              userContext,
            )

            // if it already exists on cache, some other organization should be already enriched, find that org

            const findOrg = await options.database.organization.findOne({
              attributes: ['id', 'name', 'url'],
              where: {
                url: orgFromGH.url,
                name: orgFromGH.name,
                tenantId: tenant.id,
              },
            })

            if (checkCache && findOrg) {
              // update current organizations members to found organization
              const memberOrganizationsUpdateQuery = `UPDATE "memberOrganizations" SET "organizationId" = :existingOrganizationId WHERE "organizationId" = :duplicateOrganizationId`
              await options.database.sequelize.query(memberOrganizationsUpdateQuery, {
                type: QueryTypes.UPDATE,
                replacements: {
                  existingOrganizationId: findOrg.id,
                  duplicateOrganizationId: org.id,
                },
              })

              // delete current organization
              console.log(`removing ${org.id} because ${findOrg.id} was already enriched!`)
              await OrganizationRepository.destroy(org.id, userContext, true)
            } else {
              // it's not in cache, create it
              if (!checkCache) {
                await OrganizationCacheRepository.create(orgFromGH, userContext)
              }

              // check any other organization already has names from cache
              let findByName = await options.database.organization.findAll({
                attributes: ['id', 'name'],
                where: {
                  name: orgFromGH.name,
                  tenantId: tenant.id,
                },
              })
              findByName = findByName.filter((i) => i.id !== org.id)

              if (findByName.length > 0) {
                const memberOrganizationsUpdateQuery = `UPDATE "memberOrganizations" SET "organizationId" = :existingOrganizationId WHERE "organizationId" = :duplicateOrganizationId`
                await options.database.sequelize.query(memberOrganizationsUpdateQuery, {
                  type: QueryTypes.UPDATE,
                  replacements: {
                    existingOrganizationId: org.id,
                    duplicateOrganizationId: findByName[0].id,
                  },
                })

                // delete foundByName organization
                console.log(`removing ${findByName[0].id} because ${org.id} will be enriched!`)
                await OrganizationRepository.destroy(findByName[0].id, userContext, true)
              }

              const orgFromGhParsed = {
                name: orgFromGH.name,
                url: orgFromGH.url,
                location: orgFromGH.location,
                description: orgFromGH.description,
                twitter: { handle: orgFromGH.twitterUsername },
                logo: orgFromGH.avatarUrl,
              } as any

              if (orgFromGH.email){
                orgFromGhParsed.emails = [orgFromGH.email]
              }

              // enrich the organization with cache
              await OrganizationRepository.update(
                org.id,
                {
                  ...org,
                  ...orgFromGhParsed,
                },
                userContext,
              )
            }

          }
        }
      }
    }
  }

  console.timeEnd('whole-script-time')
}
