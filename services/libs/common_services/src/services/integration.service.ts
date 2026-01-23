import { decryptData } from '@crowd/common'
import {
  InsightsProjectField,
  deleteMissingSegmentRepositories,
  queryInsightsProjects,
  updateInsightsProject,
  upsertSegmentRepositories,
} from '@crowd/data-access-layer/src/collections'
import {
  fetchIntegrationById,
  findNangoRepositoriesToBeRemoved,
  findRepositoriesForSegment,
  removePlainGitHubRepoMapping,
  removePlainGitlabRepoMapping,
} from '@crowd/data-access-layer/src/integrations'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { getRepoUrlsMappedToOtherSegments } from '@crowd/data-access-layer/src/segments'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { PlatformType } from '@crowd/types'

export class CommonIntegrationService {
  private static readonly log = getServiceChildLogger('CommonIntegrationService')

  /**
   * Safely decrypts an encrypted value, returning the original value if decryption fails
   */
  private static safeDecrypt(encryptedValue: string): string {
    try {
      return decryptData(encryptedValue)
    } catch (error) {
      CommonIntegrationService.log.warn(`Failed to decrypt value: ${error?.message || error}`)
      return encryptedValue
    }
  }

  /**
   * Decrypts encrypted settings for integrations based on platform type
   * @param platform - The integration platform (e.g., CONFLUENCE, JIRA)
   * @param settings - The settings object that may contain encrypted fields
   * @returns Settings object with decrypted values
   */
  public static decryptIntegrationSettings(platform: string, settings) {
    if (!settings) return settings

    switch (platform) {
      case PlatformType.CONFLUENCE:
        return {
          ...settings,
          apiToken: settings.apiToken
            ? CommonIntegrationService.safeDecrypt(settings.apiToken)
            : settings.apiToken,
          orgAdminApiToken: settings.orgAdminApiToken
            ? CommonIntegrationService.safeDecrypt(settings.orgAdminApiToken)
            : settings.orgAdminApiToken,
        }
      case PlatformType.JIRA:
        if (settings.auth) {
          return {
            ...settings,
            auth: {
              ...settings.auth,
              personalAccessToken: settings.auth.personalAccessToken
                ? CommonIntegrationService.safeDecrypt(settings.auth.personalAccessToken)
                : settings.auth.personalAccessToken,
              apiToken: settings.auth.apiToken
                ? CommonIntegrationService.safeDecrypt(settings.auth.apiToken)
                : settings.auth.apiToken,
            },
          }
        }
        return settings
      default:
        return settings
    }
  }

  /**
   * Syncs GitHub repositories to segmentRepositories table and updates insightsProject.repositories
   * @param qx - Query executor for database operations
   * @param redis - Redis client for cache invalidation
   * @param integrationId - The integration ID to sync repositories for
   */
  public static async syncGithubRepositoriesToInsights(
    qx: QueryExecutor,
    redis: RedisClient,
    integrationId: string,
  ): Promise<void> {
    // Fetch integration to get segmentId
    const integration = await fetchIntegrationById(qx, integrationId)

    if (!integration) {
      CommonIntegrationService.log.warn(`Integration ${integrationId} not found`)
      return
    }

    const segmentId = integration.segmentId

    // Query insights project for this segment
    const insightsProjects = await queryInsightsProjects(qx, {
      filter: {
        segmentId: { eq: segmentId },
      },
      fields: [
        InsightsProjectField.ID,
        InsightsProjectField.SEGMENT_ID,
        InsightsProjectField.REPOSITORIES,
      ],
    })

    const insightsProject = insightsProjects[0]

    if (!insightsProject) {
      CommonIntegrationService.log.info(
        `The segmentId: ${segmentId} does not have any InsightsProject related`,
      )
      return
    }

    const insightsProjectId = insightsProject.id

    // Get repositories to be removed
    const reposToBeRemoved = await findNangoRepositoriesToBeRemoved(qx, integrationId)

    // Get current repositories for segment
    const currentRepositories = await findRepositoriesForSegment(qx, segmentId)

    const currentUrls = Object.values(currentRepositories).flatMap((repos) =>
      repos.map((repo) => repo.url),
    )

    // Find repos already mapped to other segments (conflicts)
    const alreadyMappedRepos = await getRepoUrlsMappedToOtherSegments(qx, currentUrls, segmentId)

    // Unmap repositories that should be removed
    for (const repo of reposToBeRemoved) {
      await removePlainGitHubRepoMapping(qx, redis, integrationId, repo)
      await removePlainGitlabRepoMapping(qx, redis, integrationId, repo)
    }

    // Filter valid repositories (dedupe, remove deleted, remove already mapped to other segments)
    const repositories = [...new Set(currentUrls)].filter(
      (url) => !reposToBeRemoved.includes(url) && !alreadyMappedRepos.includes(url),
    )

    // Upsert repositories to segmentRepositories table
    await upsertSegmentRepositories(qx, {
      insightsProjectId,
      repositories,
      segmentId,
    })

    // Delete missing repositories from segmentRepositories table
    await deleteMissingSegmentRepositories(qx, {
      repositories,
      segmentId,
    })

    // Update insightsProject.repositories field (this also sets updatedAt automatically)
    await updateInsightsProject(qx, insightsProjectId, {
      repositories,
    })

    CommonIntegrationService.log.info(
      `Synced ${repositories.length} repositories for integration ${integrationId} to segment ${segmentId}`,
    )
  }
}
