import { LoggerBase } from '@crowd/logging'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { SearchSyncWorkerEmitter } from '@crowd/sqs'
import { FeatureFlag } from '@crowd/types'
import { getSearchSyncApiClient } from '../utils/apiClients'
import { getSearchSyncWorkerEmitter } from '@/serverless/utils/serviceSQS'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'

export default class SearchSyncService extends LoggerBase {
  static async getSearchSyncClient(
    options,
  ): Promise<SearchSyncApiClient | SearchSyncWorkerEmitter> {
    if (await isFeatureEnabled(FeatureFlag.SYNCHRONOUS_OPENSEARCH_UPDATES, options)) {
      return getSearchSyncApiClient()
    }

    return getSearchSyncWorkerEmitter()
  }

  static async triggerMemberSync(tenantId: string, memberId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient) {
      await client.triggerMemberSync(memberId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerMemberSync(tenantId, memberId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerTenantMembersSync(tenantId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerTenantMembersSync(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerOrganizationMembersSync(organizationId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationMembersSync(organizationId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerRemoveMember(tenantId: string, memberId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient) {
      await client.triggerRemoveMember(memberId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerRemoveMember(tenantId, memberId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerMemberCleanup(tenantId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerMemberCleanup(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerActivitySync(tenantId: string, activityId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient) {
      await client.triggerActivitySync(activityId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerActivitySync(tenantId, activityId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerTenantActivitiesSync(tenantId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerTenantActivitiesSync(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerOrganizationActivitiesSync(organizationId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationActivitiesSync(organizationId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerRemoveActivity(tenantId: string, activityId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient) {
      await client.triggerRemoveActivity(activityId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerRemoveActivity(tenantId, activityId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerActivityCleanup(tenantId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerActivityCleanup(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerOrganizationSync(tenantId: string, organizationId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient) {
      await client.triggerOrganizationSync(organizationId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationSync(tenantId, organizationId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerTenantOrganizationSync(tenantId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerTenantOrganizationSync(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerRemoveOrganization(tenantId: string, organizationId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient) {
      await client.triggerRemoveOrganization(organizationId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerRemoveOrganization(tenantId, organizationId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  static async triggerOrganizationCleanup(tenantId: string, options) {
    const client = await SearchSyncService.getSearchSyncClient(options)

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationCleanup(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }
}
