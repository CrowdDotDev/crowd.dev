import Sequelize, { QueryTypes } from 'sequelize'

import { generateUUIDv1 } from '@crowd/common'
import { getServiceLogger } from '@crowd/logging'
import { FeatureFlag, PLAN_LIMITS, TenantPlans } from '@crowd/types'

import { UNLEASH_CONFIG } from '../../conf'
import { UnleashContextField } from '../../types/unleashContext'

/* eslint-disable no-console */

const log = getServiceLogger()

const constaintConfiguration = {
  [FeatureFlag.AUTOMATIONS]: [
    [
      {
        values: [TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Scale][FeatureFlag.AUTOMATIONS].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'automationCount',
        caseInsensitive: false,
      },
    ],
    [
      {
        values: [TenantPlans.Growth],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.AUTOMATIONS].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'automationCount',
        caseInsensitive: false,
      },
    ],
    [
      {
        values: [TenantPlans.Essential],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Essential][FeatureFlag.AUTOMATIONS].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'automationCount',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.CSV_EXPORT]: [
    [
      {
        values: [TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Scale][FeatureFlag.CSV_EXPORT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'csvExportCount',
        caseInsensitive: false,
      },
    ],
    [
      {
        values: [TenantPlans.Growth],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.CSV_EXPORT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'csvExportCount',
        caseInsensitive: false,
      },
    ],
    [
      {
        values: [TenantPlans.Essential],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Essential][FeatureFlag.CSV_EXPORT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'csvExportCount',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.EAGLE_EYE]: [
    [
      {
        values: [TenantPlans.Growth, TenantPlans.EagleEye, TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.FIND_GITHUB]: [[]],
  [FeatureFlag.LINKEDIN]: [
    [
      {
        values: [TenantPlans.Growth, TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.HUBSPOT]: [
    [
      {
        values: [TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.MEMBER_ENRICHMENT]: [
    [
      {
        values: [TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Scale][FeatureFlag.MEMBER_ENRICHMENT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'memberEnrichmentCount',
        caseInsensitive: false,
      },
    ],
    [
      {
        values: [TenantPlans.Growth],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.MEMBER_ENRICHMENT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'memberEnrichmentCount',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.ORGANIZATION_ENRICHMENT]: [
    [
      {
        values: [TenantPlans.Scale],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Scale][FeatureFlag.ORGANIZATION_ENRICHMENT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'organizationEnrichmentCount',
        caseInsensitive: false,
      },
    ],
    [
      {
        values: [TenantPlans.Growth],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
      {
        value: PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.ORGANIZATION_ENRICHMENT].toString(),
        values: [],
        inverted: false,
        operator: 'NUM_LT',
        contextName: 'organizationEnrichmentCount',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.SEGMENTS]: [],

  // temporal
  [FeatureFlag.TEMPORAL_MEMBERS_ENRICHMENT]: [
    [
      {
        values: [TenantPlans.Scale, TenantPlans.Enterprise],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],

  [FeatureFlag.TEMPORAL_MEMBER_MERGE_SUGGESTIONS]: [
    [
      {
        values: [
          TenantPlans.Essential,
          TenantPlans.Growth,
          TenantPlans.Scale,
          TenantPlans.Enterprise,
        ],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],

  [FeatureFlag.SYNCHRONOUS_OPENSEARCH_UPDATES]: [
    [
      {
        values: [
          TenantPlans.Scale,
          TenantPlans.EagleEye,
          TenantPlans.Enterprise,
          TenantPlans.Essential,
          TenantPlans.Growth,
        ],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],

  [FeatureFlag.SERVE_PROFILES_OPENSEARCH]: [
    [
      {
        values: [
          TenantPlans.Scale,
          TenantPlans.EagleEye,
          TenantPlans.Enterprise,
          TenantPlans.Essential,
          TenantPlans.Growth,
        ],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],
  [FeatureFlag.TEMPORAL_ORGANIZATION_ENRICHMENT]: [
    [
      {
        values: [
          TenantPlans.Scale,
          TenantPlans.EagleEye,
          TenantPlans.Enterprise,
          TenantPlans.Essential,
          TenantPlans.Growth,
        ],
        inverted: false,
        operator: 'IN',
        contextName: 'plan',
        caseInsensitive: false,
      },
    ],
  ],
}

let seq: any

setImmediate(async () => {
  seq = new (Sequelize as any)(
    UNLEASH_CONFIG.db.database,
    UNLEASH_CONFIG.db.username,
    UNLEASH_CONFIG.db.password,
    {
      dialect: 'postgres',
      port: UNLEASH_CONFIG.db.port,
      replication: {
        read: [{ host: UNLEASH_CONFIG.db.host }],
        write: { host: UNLEASH_CONFIG.db.host },
      },
      logging: false,
    },
  )

  await createApiToken(UNLEASH_CONFIG.adminApiKey, 'admin-token', 'admin')
  await createApiToken(UNLEASH_CONFIG.frontendApiKey, 'frontend-token', 'frontend')
  await createApiToken(UNLEASH_CONFIG.backendApiKey, 'backend-token', 'client')

  const allContextFields = Object.values(UnleashContextField)
  for (const field of allContextFields) {
    await createContextField(field)
  }

  const allFeatureFlags = Object.values(FeatureFlag)
  for (const flag of allFeatureFlags) {
    await createFeatureFlag(flag)
    await createStrategy(flag, constaintConfiguration[flag])
  }

  process.exit(0)
})

async function createApiToken(token: string, name: string, type: string): Promise<void> {
  const results = await seq.query(
    'select * from api_tokens where secret = :token and type = :type and username = :name;',
    {
      replacements: {
        token,
        name,
        type,
      },
      type: QueryTypes.SELECT,
    },
  )
  if (results.length === 0) {
    log.info(`${name} token not found - creating...`)
    await seq.query(
      `insert into api_tokens(secret, username, type, environment) values (:token, :name, :type, 'production')`,
      {
        replacements: {
          token,
          name,
          type,
        },
        type: QueryTypes.INSERT,
      },
    )
  } else {
    log.info(`${name} token found!`)
  }
}

async function createContextField(field: string): Promise<void> {
  const results = await seq.query(`select * from context_fields where name = :field`, {
    replacements: {
      field,
    },
    type: QueryTypes.SELECT,
  })

  if (results.length === 0) {
    log.info(`Context field ${field} not found - creating...`)
    await seq.query(`insert into context_fields(name, stickiness) values (:field, true)`, {
      replacements: {
        field,
      },
      type: QueryTypes.INSERT,
    })
  } else {
    log.info(`Context field ${field} found!`)
  }
}

async function createFeatureFlag(flag: FeatureFlag): Promise<void> {
  const results = await seq.query(
    `select * from features where name = :flag and type = 'permission'`,
    {
      replacements: {
        flag,
      },
      type: QueryTypes.SELECT,
    },
  )

  if (results.length === 0) {
    log.info(`Feature flag ${flag} not found - creating...`)
    await seq.query(
      `insert into features(name, description, type) values (:flag, '', 'permission')`,
      {
        replacements: {
          flag,
        },
        type: QueryTypes.INSERT,
      },
    )
    await seq.query(
      `insert into feature_environments(environment, feature_name, enabled) values ('production', :flag, true)`,
      {
        replacements: {
          flag,
        },
        type: QueryTypes.INSERT,
      },
    )
  } else {
    log.info(`Feature flag ${flag} found!`)
  }
}

async function createStrategy(flag: FeatureFlag, constraints: any[]): Promise<void> {
  const results = await seq.query(
    `select * from feature_strategies where feature_name = :flag and project_name = 'default' and environment = 'production' and strategy_name = 'default'`,
    {
      replacements: {
        flag,
      },
      type: QueryTypes.SELECT,
    },
  )

  if (results.length > 0) {
    log.warn(`Feature flag ${flag} constraints found - re-creating...`)
    await seq.query(
      `delete from feature_strategies where feature_name = :flag and project_name = 'default' and environment = 'production' and strategy_name = 'default'`,
      {
        replacements: {
          flag,
        },
        type: QueryTypes.DELETE,
      },
    )
  }

  log.info(`Feature flag ${flag} constraints not found - creating...`)
  constraints = constraints || []
  for (const constraint of constraints) {
    const id = generateUUIDv1()
    await seq.query(
      `insert into feature_strategies(id, feature_name, project_name, environment, strategy_name, constraints) values (:id, :flag, 'default', 'production', 'default', :constraint)`,
      {
        replacements: {
          flag,
          id,
          constraint: JSON.stringify(constraint),
        },
        type: QueryTypes.INSERT,
      },
    )
  }
}
