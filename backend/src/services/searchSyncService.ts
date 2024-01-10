import { LoggerBase } from '@crowd/logging'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { FeatureFlag, SyncMode } from '@crowd/types'
import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import { getSearchSyncApiClient } from '../utils/apiClients'
import { getSearchSyncWorkerEmitter } from '@/serverless/utils/serviceSQS'
import isFeatureEnabled from '@/feature-flags/isFeatureEnabled'
import { IS_TEST_ENV } from '@/conf'
import { IServiceOptions } from './IServiceOptions'

export type SearchSyncClient = SearchSyncApiClient | SearchSyncWorkerEmitter

export default class SearchSyncService extends LoggerBase {
  options: IServiceOptions

  mode: SyncMode

  constructor(options: IServiceOptions, mode: SyncMode = SyncMode.USE_FEATURE_FLAG) {
    super(options.log)
    this.options = options
    this.mode = mode
  }

  async getSearchSyncClient(): Promise<SearchSyncClient> {
    // tests can always use the async emitter
    if (IS_TEST_ENV) {
      return getSearchSyncWorkerEmitter()
    }

    if (this.mode === SyncMode.SYNCHRONOUS) {
      return getSearchSyncApiClient()
    }

    if (this.mode === SyncMode.ASYNCHRONOUS) {
      return getSearchSyncWorkerEmitter()
    }

    if (this.mode === SyncMode.USE_FEATURE_FLAG) {
      if (await isFeatureEnabled(FeatureFlag.SYNCHRONOUS_OPENSEARCH_UPDATES, this.options)) {
        return getSearchSyncApiClient()
      }

      return getSearchSyncWorkerEmitter()
    }

    throw new Error(`Unknown mode ${this.mode} !`)
  }

  async triggerMemberSync(tenantId: string, memberId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await client.triggerMemberSync(memberId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerMemberSync(tenantId, memberId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerTenantMembersSync(tenantId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerTenantMembersSync(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerOrganizationMembersSync(tenantId: string, organizationId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationMembersSync(tenantId, organizationId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerRemoveMember(tenantId: string, memberId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await client.triggerRemoveMember(memberId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerRemoveMember(tenantId, memberId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerMemberCleanup(tenantId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerMemberCleanup(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerActivitySync(tenantId: string, activityId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await client.triggerActivitySync(activityId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerActivitySync(tenantId, activityId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerTenantActivitiesSync(tenantId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerTenantActivitiesSync(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerOrganizationActivitiesSync(tenantId: string, organizationId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationActivitiesSync(tenantId, organizationId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerRemoveActivity(tenantId: string, activityId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await client.triggerRemoveActivity(activityId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerRemoveActivity(tenantId, activityId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerActivityCleanup(tenantId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerActivityCleanup(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerOrganizationSync(tenantId: string, organizationId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await client.triggerOrganizationSync(organizationId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationSync(tenantId, organizationId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerTenantOrganizationSync(tenantId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerTenantOrganizationSync(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerRemoveOrganization(tenantId: string, organizationId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await client.triggerRemoveOrganization(organizationId)
    } else if (client instanceof SearchSyncWorkerEmitter) {
      await client.triggerRemoveOrganization(tenantId, organizationId, false)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerOrganizationCleanup(tenantId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient || client instanceof SearchSyncWorkerEmitter) {
      await client.triggerOrganizationCleanup(tenantId)
    } else {
      throw new Error('Unexpected search client type!')
    }
  }
}
