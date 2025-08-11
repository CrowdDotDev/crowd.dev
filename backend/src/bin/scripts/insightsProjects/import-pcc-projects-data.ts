/* eslint-disable @typescript-eslint/dot-notation */

/* eslint-disable no-console */

/* eslint-disable import/no-extraneous-dependencies */

/**
 * Access Snowflake's instance: https://app.snowflake.com/jnmhvwd/xpb85243
 * Create a new worksheet and run the query below.
 * Download the results as a CSV file.
 * 
 * How to run this script:
 * 1. Push and deploy your changes on this file if needed
 * 2. cd crowd-kube/lf-production
 * 3. kubectl config use-context <prod-context-name>
 * 4. kubepods | grep script-
 * 5. kubectl cp /local/path/report.csv <pod-name>://usr/crowd/app/crowd.dev/backend/pcc_projects_data.csv
 * 6. kubectl exec -it <pod-name> -- sh
 * 7. cd crowd.dev
 * 8. git status
 * 9. git pull (make sure you are on the right branch)
 * 10. cd backend
 * 11. Make sure your csv file is in the right location and that you have all changes you need. And then run the script.
 * 12. LOG_LEVEL=debug SERVICE=script ./node_modules/.bin/tsx src/bin/scripts/import-pcc-projects-data.ts --file ./pcc_projects_data.csv
 *  
SELECT 
  CASE WHEN p.NAME IN ('', 'nil') THEN NULL ELSE p.name END AS NAME,
  CASE WHEN p.SLUG__C IN ('', 'nil') THEN NULL ELSE p.slug__c END AS SLUG__C,
  CASE WHEN p.REPOSITORYURL__C IN ('', 'nil') THEN NULL ELSE p.REPOSITORYURL__C END AS REPOSITORYURL__C,
  CASE WHEN p.DESCRIPTION__C IN ('', 'nil') THEN NULL ELSE p.DESCRIPTION__C END AS DESCRIPTION__C,
  CASE WHEN p.WEBSITE__C IN ('', 'nil') THEN NULL ELSE p.WEBSITE__C END AS WEBSITE__C,
  CASE WHEN p.TWITTER__C IN ('', 'nil') THEN NULL ELSE p.TWITTER__C END AS TWITTER__C,
  CASE WHEN p.LINKEDIN__C IN ('', 'nil') THEN NULL ELSE p.LINKEDIN__C END AS LINKEDIN__C
FROM 
  FIVETRAN_INGEST.SFDC_CONNECTOR_PROD_SALESFORCE.PROJECT__C p
JOIN 
  FIVETRAN_INGEST.crowd_prod_public.segments s
  ON p.slug__c = s.slug
WHERE 
  s.parentslug IS NOT NULL
  AND s.grandparentslug IS NOT NULL;

*/
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import path from 'path'

import { databaseInit } from '@/database/databaseConnection'
import { IRepositoryOptions } from '@/database/repositories/IRepositoryOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'file',
    alias: 'f',
    type: String,
    description: 'Path to CSV file to import',
  },
]

const sections = [
  {
    header: 'Update Insights Projects with PCC Data',
    content: 'Updates insights projects with data from PCC projects CSV export.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.file) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const prodDb = await databaseInit()
    const qx = SequelizeRepository.getQueryExecutor({
      database: prodDb,
    } as IRepositoryOptions)

    const fileData = fs.readFileSync(path.resolve(parameters.file), 'utf-8')

    const records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
    })

    console.log('Processing records:', records.length)

    let updatedCount = 0
    let notFoundCount = 0

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const slug = record['SLUG__C']

      console.log(`Processing record ${i + 1}/${records.length}:`, slug)

      try {
        // Find matching insights project
        const result = await qx.result(
          `UPDATE "insightsProjects" 
           SET 
             description = CASE WHEN $1 IS NOT NULL THEN $1 ELSE description END,
             github = CASE WHEN $2 IS NOT NULL THEN $2 ELSE github END,
             twitter = CASE WHEN $3 IS NOT NULL THEN $3 ELSE twitter END,
             linkedin = CASE WHEN $4 IS NOT NULL THEN $4 ELSE linkedin END,
             website = CASE WHEN $5 IS NOT NULL THEN $5 ELSE website END,
             "updatedAt" = NOW()
           WHERE slug = $6
           RETURNING *`,
          [
            record['DESCRIPTION__C'] || null,
            record['REPOSITORYURL__C'] || null,
            record['TWITTER__C'] || null,
            record['LINKEDIN__C'] || null,
            record['WEBSITE__C'] || null,
            slug,
          ],
        )

        if (result > 0) {
          console.log('Updated project:', slug)
          updatedCount++
        } else {
          console.log('No matching project found for slug:', slug)
          notFoundCount++
        }
      } catch (error) {
        console.error('Error updating project:', slug, error)
        notFoundCount++
      }
    }

    console.log('\nFinal Summary:')
    console.log('Total projects processed:', records.length)
    console.log('Successfully updated:', updatedCount)
    console.log('Not found or failed:', notFoundCount)
    console.log(`Success rate: ${((updatedCount / records.length) * 100).toFixed(2)}%`)

    console.log('Processing complete')
    process.exit(0)
  })
}
