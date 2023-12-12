import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { QueryTypes } from 'sequelize'
import * as fs from 'fs'
import path from 'path'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import TenantService from '@/services/tenantService'
import OrganizationService from '@/services/organizationService'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant',
  },
  {
    name: 'allTenants',
    alias: 'a',
    type: Boolean,
    defaultValue: false,
    description: 'Set this flag to merge similar organizations for all tenants.',
  },
  {
    name: 'similarityThreshold',
    alias: 's',
    type: Boolean,
    defaultValue: false,
    description:
      'Similarity threshold of organization merge suggestions. Suggestions lower than this value will not be merged. Defaults to 0.95',
  },
  {
    name: 'hardLimit',
    alias: 'h',
    type: Boolean,
    defaultValue: false,
    description: `Hard limit for # of organizations that'll be merged. Mostly a flag for testing purposes.`,
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]
const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Merge organizations with similarity higher than given threshold.',
    content: 'Merge organizations with similarity higher than given threshold.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || (!parameters.tenant && !parameters.allTenants)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const orgService = new OrganizationService(options)

    let tenantIds

    if (parameters.allTenants) {
      tenantIds = (await TenantService._findAndCountAllForEveryUser({})).rows.map((t) => t.id)
    } else if (parameters.tenant) {
      tenantIds = parameters.tenant.split(',')
    } else {
      tenantIds = []
    }

    for (const tenantId of tenantIds) {
      let offset = 0
      let hasMoreData = true

      while (hasMoreData) {
        // find organization merge suggestions of tenant
        const result = await options.database.sequelize.query(
          `
                SELECT 
                "ot"."organizationId", 
                "ot"."toMergeId", 
                "ot".similarity, 
                "ot".status,
                "org1"."displayName" AS "orgDisplayName",
                "org2"."displayName" AS "mergeDisplayName"
                FROM 
                    "organizationToMerge" "ot"
                LEFT JOIN 
                    "organizations" "org1" 
                ON 
                    "ot"."organizationId" = "org1"."id"
                LEFT JOIN 
                    "organizations" "org2" 
                ON 
                    "ot"."toMergeId" = "org2"."id"
                WHERE 
                    ("ot".similarity > :similarityThreshold) AND
                    ("org1"."displayName" = "org2"."displayName") AND
                    ("org1"."tenantId" = :tenantId) AND
                    ("org2"."tenantId" = :tenantId)
                ORDER BY 
                    "ot".similarity DESC
                LIMIT 100 
                OFFSET :offset;`,
          {
            replacements: {
              similarityThreshold: parameters.similarityThreshold || 0.95,
              offset,
              tenantId,
            },
            type: QueryTypes.SELECT,
          },
        )

        if (result.length === 0) {
          hasMoreData = false
        } else {
          // Process the result here, e.g.
          // for (const row of result) { /* process row */ }
          let counter = 0
          for (const row of result) {
            console.log(`Merging ${row.organizationId} into ${row.toMergeId}...`)
            await orgService.mergeAsync(row.organizationId, row.toMergeId)

            if (parameters.hardLimit && counter >= parameters.hardLimit) {
              console.log(`Hard limit of ${parameters.hardLimit} reached. Exiting...`)
              break
            }

            counter += 1
          }
          offset += 100
        }
      }
    }

    process.exit(0)
  })
}
