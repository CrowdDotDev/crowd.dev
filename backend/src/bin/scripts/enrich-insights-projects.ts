/* eslint-disable no-console */

/* eslint-disable import/no-extraneous-dependencies */
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
    header: 'Enrich Insights Projects',
    content: 'Updates insights projects descriptions and keywords from a CSV file.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

function parseKeywords(keywordsStr: string): string[] {
  if (!keywordsStr) return []
  
  try {
    // Convert single quotes to double quotes for JSON parsing
    const jsonStr = keywordsStr.replace(/'/g, '"')
    const keywords = JSON.parse(jsonStr)
    
    if (!Array.isArray(keywords)) {
      throw new Error(`Keywords must be an array, got: ${keywordsStr}`)
    }
    
    return keywords.map(k => k.toString().trim())
  } catch (e) {
    throw new Error(`Failed to parse keywords array: ${keywordsStr}. Error: ${e.message}`)
  }
}

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

    try {
      const fileData = fs.readFileSync(path.resolve(parameters.file), 'utf-8')

      const records = parse(fileData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })

      console.log('Processing records:', records.length)

      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const { id, description, keywords } = record

        if (id) {
          try {
            // Check if project exists
            const project = await qx.selectOneOrNone(
              'SELECT id FROM "insightsProjects" WHERE id = $1',
              [id],
            )

            if (project) {
              // Prepare update data
              const updateData: {
                description?: string
                keywords?: string[]
              } = {}

              if (description) {
                updateData.description = description
              }

              if (keywords) {
                try {
                  updateData.keywords = parseKeywords(keywords)
                } catch (err) {
                  console.error(`Failed to parse keywords for project ${id}:`, err.message)
                }
              }

              if (Object.keys(updateData).length > 0) {
                // Update project
                await qx.result(
                  `
                  UPDATE "insightsProjects" 
                  SET 
                    ${Object.keys(updateData)
                      .map((key) => `"${key}" = $(${key})`)
                      .join(', ')},
                    "updatedAt" = CURRENT_TIMESTAMP
                  WHERE id = $(id)
                  `,
                  {
                    ...updateData,
                    id,
                  },
                )

                console.log(`Successfully updated project ${id}`)
              } else {
                console.warn(`No data to update for project ${id} - skipping`)
              }
            } else {
              console.warn(`Project with id ${id} not found - skipping`)
            }
          } catch (err) {
            console.error('Failed to process row:', err)
          }
        } else {
          console.warn('Skipping row - missing id')
        }
      }

      console.log('Finished processing CSV file')
      process.exit(0)
    } catch (err) {
      console.error('Failed to process CSV file:', err)
      process.exit(1)
    }
  })
} 