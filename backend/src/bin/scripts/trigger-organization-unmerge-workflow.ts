import commandLineArgs from 'command-line-args'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { OrganizationField, findOrgById, pgpQx } from '@crowd/data-access-layer'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getTemporalClient } from '@crowd/temporal'

import { DB_CONFIG, TEMPORAL_CONFIG } from '@/conf'

const log = getServiceLogger()

const options = [
  {
    name: 'primaryId',
    alias: 'p',
    type: String,
    description: 'Primary organization id',
  },
  {
    name: 'secondaryId',
    alias: 's',
    type: String,
    description: 'Secondary organization id',
  },
  {
    name: 'userId',
    alias: 'u',
    type: String,
    description: 'User id',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]

const parameters = commandLineArgs(options)

setImmediate(async () => {
  const primaryId = parameters.primaryId
  const secondaryId = parameters.secondaryId

  const userId = parameters.userId

  const db = await getDbConnection({
    host: DB_CONFIG.readHost,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.username,
    password: DB_CONFIG.password,
  })

  const qx = pgpQx(db)
  const temporal = await getTemporalClient(TEMPORAL_CONFIG)

  log.info({ primaryId, secondaryId }, 'Running script with the following parameters!')

  const primaryOrganization = await findOrgById(qx, primaryId, [
    OrganizationField.ID,
    OrganizationField.DISPLAY_NAME,
  ])
  const secondaryOrganization = await findOrgById(qx, secondaryId, [
    OrganizationField.ID,
    OrganizationField.DISPLAY_NAME,
  ])

  if (!primaryOrganization || !secondaryOrganization) {
    log.error({ primaryId, secondaryId }, 'Primary or secondary organization not found!')
    process.exit(1)
  }

  try {
    await temporal.workflow.start('finishOrganizationUnmerging', {
      taskQueue: 'entity-merging',
      workflowId: `finishOrganizationUnmerging/${primaryId}/${secondaryId}`,
      retry: {
        maximumAttempts: 10,
      },
      args: [
        primaryOrganization.id,
        secondaryOrganization.id,
        primaryOrganization.displayName,
        secondaryOrganization.displayName,
        userId,
      ],
      searchAttributes: {
        TenantId: [DEFAULT_TENANT_ID],
      },
    })

    // wait till the workflow is finished
    await temporal.workflow.result(`finishOrganizationUnmerging/${primaryId}/${secondaryId}`)
  } catch (err) {
    log.error(
      { primaryId, secondaryId, err },
      'Failed to trigger workflow for organization unmerge!',
    )
    throw err
  }

  process.exit(0)
})
