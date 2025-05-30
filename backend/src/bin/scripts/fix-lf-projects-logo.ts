/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */

/**
 * Access Snowflake's instance: https://app.snowflake.com/jnmhvwd/xpb85243
 * Create a new worksheet and run the query below.
 * Download the results as a CSV file.
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
  }
]

const sections = [
  {
    header: 'Update LF Insights Projects with GH logo',
    content: 'Update LF Insights Projects with GH logo from CSV file.',
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
      const slug = record['slug']

      console.log(`Processing record ${i + 1}/${records.length}:`, slug)

      try {
        // Find matching insights project
        const result = await qx.result(
          `UPDATE "insightsProjects" 
           SET
             "logoUrl" = CASE WHEN $1 IS NOT NULL THEN $1 ELSE "logoUrl" END,
             "updatedAt" = NOW()
           WHERE slug = $2
           AND "isLF" = true
           RETURNING *`,
          [
            record['logoUrl'] || null,
            slug
          ]
        )

        if (result.rows?.length > 0) {
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
