import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import { LoggerBase, logExecutionTimeV2 } from '@crowd/logging'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { SyncMode } from '@crowd/types'

import { IS_TEST_ENV } from '@/conf'
import { getSearchSyncWorkerEmitter } from '@/serverless/utils/queueService'

import { getSearchSyncApiClient } from '../utils/apiClients'

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

    throw new Error(`Unknown mode ${this.mode} !`)
  }

  private async logExecutionTime<T>(process: () => Promise<T>, name: string): Promise<T> {
    if (this.options.profileSql) {
      return logExecutionTimeV2(process, this.options.log, name)
    }

    return process()
  }

  async triggerMemberSync(tenantId: string, memberId: string, opts: { withAggs?: boolean } = {}) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await this.logExecutionTime(
        () => client.triggerMemberSync(memberId, opts),
        `triggerMemberSync: tenant:${tenantId}, member:${memberId}`,
      )
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
      await this.logExecutionTime(
        () => client.triggerOrganizationMembersSync(tenantId, organizationId, false),
        `triggerOrganizationMembersSync: tenant:${tenantId}, organization:${organizationId}`,
      )
    } else {
      throw new Error('Unexpected search client type!')
    }
  }

  async triggerRemoveMember(tenantId: string, memberId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await this.logExecutionTime(
        () => client.triggerRemoveMember(memberId),
        `triggerRemoveMember: tenant:${tenantId}, member:${memberId}`,
      )
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

  async triggerOrganizationSync(tenantId: string, organizationId: string) {
    const client = await this.getSearchSyncClient()

    if (client instanceof SearchSyncApiClient) {
      await this.logExecutionTime(
        () => client.triggerOrganizationSync(organizationId),
        `triggerOrganizationSync: tenant:${tenantId}, organization:${organizationId}`,
      )
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
      await this.logExecutionTime(
        () => client.triggerRemoveOrganization(organizationId),
        `triggerRemoveOrganization: tenant:${tenantId}, organization:${organizationId}`,
      )
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
