import { log } from 'console'

import { getServiceChildLogger, logExecutionTimeV2, timer } from '@crowd/logging'
import { SnowflakeClient } from '@crowd/snowflake'

const logger = getServiceChildLogger('snowflake')

setImmediate(async () => {
  const client = SnowflakeClient.fromEnv()

  const query = `
    SELECT
        repo_name,
        payload,
        issue_id,
        created_at,
        type,
        repo_id,
        repo_url,
        org_url,
        org_id,
        payload_action
    FROM github_events_ingest.cybersyn.github_events
    WHERE type = 'PushEvent'
      AND repo_name = 'Cadiducho/PrognoSports-Frontend'
      AND repo_id = 165435967
      AND repo_url = 'https://api.github.com/repos/Cadiducho/PrognoSports-Frontend'
    LIMIT 111;
  `

  logger.info('going to run query')

  await logExecutionTimeV2(() => client.run(query, []), logger, 'just query') // 22.11

  // const t = timer(logger, 'streaming query start')
  // await client.stream(query, [], (row) => {
  //   t.end()
  //   logger.info('row', row.CREATED_AT)
  // }) // 211.64s
  process.exit(0)
})
