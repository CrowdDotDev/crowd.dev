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

  // const tenants = await TenantService._findAndCountAllForEveryUser({})

  const tenantsQuery = `select * from tenants`

  let tenants = await options.database.sequelize.query(tenantsQuery, {
    type: QueryTypes.SELECT,
  })

  tenants = [tenants[0]]

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
            const findByUrl = await OrganizationRepository.findByUrl(orgFromGH.url, userContext)
            const findByName = await OrganizationRepository.findByName(orgFromGH.name, userContext)

            if (findByUrl) {
              const memberOrganizationsUpdateQuery = `UPDATE "memberOrganizations" SET "organizationId" = :existingOrganizationId WHERE "organizationId" = :duplicateOrganizationId`
              await options.database.sequelize.query(memberOrganizationsUpdateQuery, {
                type: QueryTypes.UPDATE,
                replacements: {
                  existingOrganizationId: findByUrl.id,
                  duplicateOrganizationId: org.id,
                },
              })

              // remove duplicate
              await OrganizationRepository.destroy(org.id, userContext)
            } else if (findByName) {
              const memberOrganizationsUpdateQuery = `UPDATE "memberOrganizations" SET "organizationId" = :existingOrganizationId WHERE "organizationId" = :duplicateOrganizationId`
              await options.database.sequelize.query(memberOrganizationsUpdateQuery, {
                type: QueryTypes.UPDATE,
                replacements: {
                  existingOrganizationId: findByName.id,
                  duplicateOrganizationId: org.id,
                },
              })

              await OrganizationRepository.update(
                findByName.id,
                { ...org, ...orgFromGH },
                userContext,
              )
              await OrganizationRepository.destroy(org.id, userContext)
            } else {
              const checkCache = await OrganizationCacheRepository.findByUrl(
                orgFromGH.url,
                userContext,
              )
              if (!checkCache) {
                await OrganizationCacheRepository.create(orgFromGH, userContext)
              }
              await OrganizationRepository.update(org.id, { ...org, ...orgFromGH }, userContext)
            }
          }
        }
      }
    }
  }
}
