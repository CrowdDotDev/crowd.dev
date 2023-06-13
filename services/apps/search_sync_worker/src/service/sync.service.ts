import { MemberRepository } from '@/repo/member.repo'
import { OpenSearchIndex } from '@/types'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { OpenSearchService } from './opensearch.service'
import { timeout } from '@crowd/common'
import { IDbMemberSyncData } from '@/repo/member.data'

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

  private static prefixData(data: IDbMemberSyncData): unknown {
    const p: Record<string, unknown> = {}

    p.uuid_id = data.id
    p.uuid_tenantId = data.tenantId
    p.string_displayName = data.displayName
    p.obj_attributes = data.attributes
    // TODO handle attributes separately
    p.string_arr_emails = data.emails
    p.int_score = data.score
    p.date_lastEnriched = data.lastEnriched
    p.date_joinedAt = data.joinedAt
    p.int_totalReach = data.totalReach
    p.int_numberOfOpenSourceContributions = data.numberOfOpenSourceContributions
    p.string_arr_activeOn = data.activeOn
    p.int_activityCount = data.activityCount
    p.string_arr_activityTypes = data.activityTypes
    p.int_activeDaysCount = data.activeDaysCount
    p.date_lastActive = data.lastActive
    p.float_averageSentiment = data.averageSentiment

    const p_identities = []
    for (const identity of data.identities) {
      p_identities.push({
        string_platform: identity.platform,
        string_username: identity.username,
      })
    }
    p.obj_arr_identities = p_identities

    const p_organizations = []
    for (const organization of data.organizations) {
      p_organizations.push({
        uuid_id: organization.id,
        string_logo: organization.logo,
        string_displayName: organization.displayName,
      })
    }
    p.obj_arr_organizations = p_organizations

    const p_tags = []
    for (const tag of data.tags) {
      p_tags.push({
        uuid_id: tag.id,
        string_name: tag.name,
      })
    }

    p.obj_arr_tags = p_tags

    p.uuid_arr_toMergeIds = data.toMergeIds
    p.uuid_arr_noMergeIds = data.noMergeIds

    return p
  }
}
