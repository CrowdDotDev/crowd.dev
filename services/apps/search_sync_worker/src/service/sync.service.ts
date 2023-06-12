import { MemberRepository } from '@/repo/member.repo'
import { OpenSearchIndex } from '@/types'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { OpenSearchService } from './opensearch.service'
import { timeout } from '@crowd/common'

export class SyncService extends LoggerBase {
  private readonly memberRepo: MemberRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.memberRepo = new MemberRepository(store, this.log)
  }

  public async syncTenantMembers(tenantId: string): Promise<void> {
    this.log.warn({ tenantId }, 'Syncing all tenant members!')

    let count = 0

    let page = 1
    const perPage = 500
    let members = await this.memberRepo.getTenantMembers(tenantId, page, perPage)

    while (members.length > 0) {
      count += members.length

      await this.openSearchService.bulkIndex(
        OpenSearchIndex.MEMBERS,
        members.map((m) => {
          return {
            id: m.id,
            body: m,
          }
        }),
      )

      this.log.info({ tenantId }, `Synced ${count} members!`)
      members = await this.memberRepo.getTenantMembers(tenantId, ++page, perPage)
    }
  }

  public async syncMember(memberId: string, retries = 0): Promise<void> {
    this.log.info({ memberId }, 'Syncing member!')

    const member = await this.memberRepo.getMemberData(memberId)

    if (member) {
      await this.openSearchService.index(memberId, OpenSearchIndex.MEMBERS, member)
    } else {
      // we should retry - sometimes database is slow
      if (retries < 5) {
        await timeout(100)
        await this.syncMember(memberId, ++retries)
      } else {
        this.log.error({ memberId }, 'Member not found after 5 retries!')
      }
    }
  }
}
