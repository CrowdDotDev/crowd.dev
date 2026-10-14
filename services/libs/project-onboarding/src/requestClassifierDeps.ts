import {
  ICanonicalRepoUrl,
  ONBOARDING_AUTO_APPLY,
  canonicalizeRepoUrl,
  getErrorMessage,
} from '@crowd/common'
import { computeExclusivelyLfOwners } from '@crowd/data-access-layer/src/project-catalog/precheck'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import {
  findGithubOwnersWithLfProjects,
  findGithubOwnersWithNonLfRepos,
  findRepoUrlsInCdp,
} from '@crowd/data-access-layer/src/repositories'
import { getServiceLogger } from '@crowd/logging'
import { SnowflakeClient } from '@crowd/snowflake'

import { createCdpSegmentLookup } from './cdpSegmentLookup'
import { CatalogRowClassificationDeps } from './classifyCatalogRow'
import { IRequestClassificationDeps } from './classifyRequest'
import { IPccCandidateRow, createPccCandidatesLookup } from './pccLookup'
import { createOnboardingRequestLlm } from './requestLlm'
import { IOnboardingRequestLookups } from './requestResolver'

const log = getServiceLogger()

function createSnowflakeClient(): SnowflakeClient | null {
  if (!process.env.CROWD_SNOWFLAKE_ACCOUNT) {
    log.warn('Snowflake is not configured, PCC lookups are unavailable.')
    return null
  }

  try {
    return SnowflakeClient.fromEnv({ parentLog: log })
  } catch (err) {
    log.warn({ error: getErrorMessage(err) }, 'Snowflake client could not be created.')
    return null
  }
}

function createExclusivelyLfOwnersLookup(
  qx: QueryExecutor,
): NonNullable<IRequestClassificationDeps['lookups']['findExclusivelyLfOwners']> {
  return async (owners) => {
    const [lfOwners, nonLfOwners] = await Promise.all([
      findGithubOwnersWithLfProjects(qx, owners),
      findGithubOwnersWithNonLfRepos(qx, owners),
    ])

    return computeExclusivelyLfOwners(lfOwners, nonLfOwners)
  }
}

export async function withRequestClassifierDeps<T>(
  qx: QueryExecutor,
  run: (deps: IRequestClassificationDeps) => Promise<T>,
): Promise<T> {
  const snowflake = createSnowflakeClient()

  try {
    return await run({
      queryLlm: createOnboardingRequestLlm(qx),
      lookups: {
        findPccCandidates: snowflake
          ? createPccCandidatesLookup((query, binds) =>
              snowflake.run<IPccCandidateRow>(query, binds),
            )
          : undefined,
        findCdpSegmentByPccProject: createCdpSegmentLookup(qx),
      },
    })
  } finally {
    await snowflake?.destroy()
  }
}

export type CatalogRowRepoLookups = Required<
  Pick<IOnboardingRequestLookups, 'findTrackedRepoUrls' | 'findExclusivelyLfOwners'>
>

function createPerRowRepoLookups(qx: QueryExecutor): CatalogRowRepoLookups {
  return {
    findTrackedRepoUrls: (repoUrls) => findRepoUrlsInCdp(qx, repoUrls),
    findExclusivelyLfOwners: createExclusivelyLfOwnersLookup(qx),
  }
}

function intersectWith(known: Set<string>): (values: string[]) => Promise<Set<string>> {
  return async (values) => new Set(values.filter((value) => known.has(value)))
}

export async function loadBatchRepoLookups(
  qx: QueryExecutor,
  repoUrls: string[],
): Promise<CatalogRowRepoLookups> {
  const githubCanonicals = repoUrls
    .map((repoUrl) => canonicalizeRepoUrl(repoUrl))
    .filter((canonical): canonical is ICanonicalRepoUrl & { isGithub: true } =>
      Boolean(canonical?.isGithub),
    )
  const canonicalUrls = [...new Set(githubCanonicals.map((canonical) => canonical.url))]
  const owners = [...new Set(githubCanonicals.map((canonical) => canonical.owner))]

  const [trackedRepoUrls, lfOwners, nonLfOwners] = await Promise.all([
    findRepoUrlsInCdp(qx, canonicalUrls),
    findGithubOwnersWithLfProjects(qx, owners),
    findGithubOwnersWithNonLfRepos(qx, owners),
  ])

  return {
    findTrackedRepoUrls: intersectWith(trackedRepoUrls),
    findExclusivelyLfOwners: intersectWith(computeExclusivelyLfOwners(lfOwners, nonLfOwners)),
  }
}

export async function withCatalogRowClassifierDeps<T>(
  qx: QueryExecutor,
  run: (deps: CatalogRowClassificationDeps) => Promise<T>,
  repoLookups: CatalogRowRepoLookups = createPerRowRepoLookups(qx),
): Promise<T> {
  return withRequestClassifierDeps(qx, (deps) =>
    run({
      ...deps,
      lookups: { ...deps.lookups, ...repoLookups },
      autoApply: ONBOARDING_AUTO_APPLY,
    }),
  )
}
