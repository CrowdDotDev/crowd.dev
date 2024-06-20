import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbMemberAttributeSetting } from './memberAttributeSettings.data'
import { RedisCache, RedisClient } from '@crowd/redis'

export default class MemberAttributeSettingsRepository extends RepositoryBase<MemberAttributeSettingsRepository> {
  private readonly memberAttributeSettingsCache: RedisCache

  constructor(redis: RedisClient, store: DbStore, parentLog: Logger) {
    super(store, parentLog)

    this.memberAttributeSettingsCache = new RedisCache('memberAttributes', redis, this.log)
  }

  public async getPlatformPriorityArray(tenantId: string): Promise<string[] | undefined> {
    const results = await this.db().oneOrNone(
      `select ("attributeSettings" -> 'priorities') as priorities from settings where "tenantId" = $(tenantId)`,
      {
        tenantId,
      },
    )

    return results?.priorities || undefined
  }

  public async getMemberAttributeSettings(tenantId: string): Promise<IDbMemberAttributeSetting[]> {
    const cached = await this.memberAttributeSettingsCache.get(tenantId)

    if (!cached) {
      const results = await this.db().any(
        `
      select id, type, "canDelete", show, label, name, options
      from "memberAttributeSettings" where "tenantId" = $(tenantId)
      `,
        {
          tenantId,
        },
      )

      const data = results.map((r) => {
        return {
          id: r.id,
          type: r.type,
          canDelete: r.canDelete,
          show: r.show,
          label: r.label,
          name: r.name,
          options: r.options,
        }
      })

      await this.memberAttributeSettingsCache.set(tenantId, JSON.stringify(data), 30 * 60)

      return data
    }

    return JSON.parse(cached)
  }
}
