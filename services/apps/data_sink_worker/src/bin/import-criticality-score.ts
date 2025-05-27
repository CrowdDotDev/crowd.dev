import { parse } from 'csv'
import fs from 'fs'
import path from 'path'

import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'

import { DB_CONFIG } from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

setImmediate(async () => {
  const dbClient = await getDbConnection(DB_CONFIG())

  log.info('Reading csv file...')

  const csvFilePath = path.resolve(__dirname, './csv/openssf-top-enriched.csv')
  const fileContent = fs.readFileSync(csvFilePath)
  const records: any[] = await new Promise((resolve, reject) =>
    parse(
      fileContent,
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      },
      (err, data) => {
        if (err) {
          return reject(err)
        }
        resolve(data)
      },
    ),
  )

  for (const row of records) {
    const { name, url, score, rank, created_at } = row
    try {
      await dbClient.none(
        `
                INSERT INTO "criticalityScores" (name, "repoUrl", score, rank, "createdAt")
                VALUES ($1, $2, $3, $4, $5)
            `,
        [name, url, score, rank, created_at],
      )
    } catch (_) {}
  }
  process.exit(0)
})
