import { getServiceLogger, logExecutionTimeV2 } from '@crowd/logging'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { databaseInit } from '../../database/databaseConnection'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
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
    header: 'Refresh materialized views',
    content: 'Refresh materialized views',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help) {
  console.log(usage)
} else {
  setImmediate(async () => {
    // initialize database with 15 minutes query timeout
    const database = await databaseInit(1000 * 60 * 15)

    const materializedViews = [
      'mv_members_cube',
      'mv_activities_cube',
      'mv_organizations_cube',
      'mv_segments_cube',
    ]

    for (const view of materializedViews) {
      await logExecutionTimeV2(
        () =>
          database.sequelize.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${view}"`, {
            useMaster: true,
          }),
        log,
        `Refresh Materialized View ${view}`,
      )
    }

    process.exit(0)
  })
}
