import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { Error400, validateUUID } from '@crowd/common'
import { findIntegrationPlatformsByIds } from '@crowd/data-access-layer/src/integrations'
import { AUTO_MANAGED_INTEGRATION_PLATFORMS } from '@crowd/types'

export function isAutoManagedPlatform(platform: unknown): boolean {
  return AUTO_MANAGED_INTEGRATION_PLATFORMS.some((p) => p === platform)
}

export function assertNoAutoManagedPlatform(language: string, platforms: unknown[]): void {
  if (platforms.some(isAutoManagedPlatform)) {
    throw new Error400(language, 'errors.integrations.autoManaged')
  }
}

// Malformed or unknown ids are skipped, so requests for other platforms fail exactly as before.
export async function assertNoAutoManagedIntegration(req, ids: unknown): Promise<void> {
  const uuids = [ids]
    .flat()
    .filter((id): id is string => typeof id === 'string' && validateUUID(id))
  const platforms = await findIntegrationPlatformsByIds(
    SequelizeRepository.getQueryExecutor(req),
    uuids,
  )
  assertNoAutoManagedPlatform(req.language, platforms)
}
