import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import MemberRepository from '../../database/repositories/memberRepository'
import { sendBulkEnrichMessage, sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import OrganizationRepository from '../../database/repositories/organizationRepository'
import { NodeWorkerMessageType } from '../../serverless/types/workerTypes'
import { NodeWorkerMessageBase } from '../../types/mq/nodeWorkerMessageBase'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant that you would like to enrich.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'organization',
    alias: 'o',
    type: Boolean,
    defaultValue: false,
    description: 'Enrich organizations of the tenant',
  },
  {
    name: 'member',
    alias: 'm',
    type: Boolean,
    defaultValue: false,
    description: 'Enrich members of the tenant',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Enrich members, organizations or both of the tenant',
    content: 'Enrich all enrichable members, organizations or both of the tenant',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || (!parameters.tenant && (!parameters.organization || !parameters.member))) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const segmentIds = SequelizeRepository.getSegmentIds(options)
    const tenantIds = parameters.tenant.split(',')
    const enrichMembers = parameters.member
    const enrichOrganizations = parameters.organization
    const limit = 1000

    for (const tenantId of tenantIds) {
      const tenant = await options.database.tenant.findByPk(tenantId)

      if (!tenant) {
        log.error({ tenantId }, 'Tenant not found!')
        process.exit(1)
      } else {
        log.info(
          { tenantId },
          `Tenant found - starting enrichment operation for tenant ${tenantId}`,
        )

        if (enrichMembers) {
          let offset = 0
          let totalMembers = 0
          let enrichedMembersCount = 0
          const failedMembers = [] // Store the IDs of failed member enrichments

          do {
            const members = await MemberRepository.findAndCountAllv2(
              { limit, offset, countOnly: false },
              options,
            )

            totalMembers = members.count
            log.info({ tenantId }, `Total members found in the tenant: ${totalMembers}`)

            for (const member of members.rows) {
              try {
                const memberToEnrich = member.id
                await sendBulkEnrichMessage(tenant, [memberToEnrich], segmentIds, false, true)
                log.info({ tenantId }, `Enriched member with ID: ${memberToEnrich}`)
                enrichedMembersCount++
              } catch (error) {
                failedMembers.push(member.id)
              }
            }

            offset += limit
          } while (totalMembers > offset)

          log.info({ tenantId }, `Members enrichment operation finished for tenant ${tenantId}`)
          log.info(
            { tenantId },
            `Enriched members count: ${enrichedMembersCount}, Failed to enrich members count: ${failedMembers.length}`,
          )

          if (failedMembers.length > 0) {
            log.error({ tenantId }, `Failed to enrich members: ${failedMembers}`)
          }
        }

        if (enrichOrganizations) {
          let offset = 0
          let totalOrganizations = 0
          let enrichedOrganizationsCount = 0
          const failedOrganizations = [] // Store the IDs of failed organization enrichments

          do {
            const organizations = await OrganizationRepository.findAndCountAll(
              { limit, offset },
              options,
            )

            totalOrganizations = organizations.count

            log.info({ tenantId }, `Total organizations found in the tenant: ${totalOrganizations}`)

            for (const organization of organizations.rows) {
              const payload = {
                type: NodeWorkerMessageType.NODE_MICROSERVICE,
                service: 'enrich-organizations',
                tenantId: organization.id,
                maxEnrichLimit: 5000,
              } as NodeWorkerMessageBase

              try {
                log.info({ payload }, 'Enricher worker payload for organization')
                await sendNodeWorkerMessage(tenantId, payload)
                enrichedOrganizationsCount++
              } catch (error) {
                failedOrganizations.push(organization.id)
              }
            }

            offset += limit
          } while (totalOrganizations > offset)

          log.info(
            { tenantId },
            `Organizations enrichment operation finished for tenant ${tenantId}`,
          )

          log.info(
            { tenantId },
            `Enriched organizations count: ${enrichedOrganizationsCount}, Failed to enrich organizations count: ${failedOrganizations.length}`,
          )

          if (failedOrganizations.length > 0) {
            log.error({ tenantId }, `Failed to enrich organizations: ${failedOrganizations}`)
          }
        }
      }
    }

    process.exit(0)
  })
}
