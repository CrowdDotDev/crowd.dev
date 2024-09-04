import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberIdentity } from '@crowd/types'

export default class RequestedForErasureMemberIdentitiesRepository extends RepositoryBase<RequestedForErasureMemberIdentitiesRepository> {
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)
  }

  public async someIdentitiesWereErasedByUserRequest(
    identities: IMemberIdentity[],
  ): Promise<boolean | null> {
    if (identities.length === 0) {
      return false
    }

    for (const identity of identities) {
      const wasRequested = await this.wasIdentityRequestedForErasure(identity)
      if (wasRequested && wasRequested.id) {
        return true
      }
    }

    return false
  }

  private async wasIdentityRequestedForErasure(
    identity: IMemberIdentity,
  ): Promise<{ id: string } | null> {
    return await this.db().oneOrNone(
      `select r.id from "requestedForErasureMemberIdentities" r
      where
        r.platform = $(platform) and
        r.type = $(type) and
        lower(r.value) = $(value)
      limit 1
    `,
      {
        platform: identity.platform,
        type: identity.type,
        value: identity.value.toLowerCase(),
      },
    )
  }
}
