import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

export default class RequestedForErasureMemberIdentitiesRepository extends RepositoryBase<RequestedForErasureMemberIdentitiesRepository> {
  constructor(store: DbStore, parentLog: Logger) {
    super(store, parentLog)
  }

  public async someIdentitiesWereErasedByUserRequest(
    identities: IMemberIdentity[],
  ): Promise<IMemberIdentity[]> {
    if (identities.length === 0) {
      return []
    }

    const toErase = []

    for (const identity of identities) {
      const wasRequested = await this.wasIdentityRequestedForErasure(identity)
      if (wasRequested && wasRequested.id) {
        toErase.push(identity)
      }
    }

    return toErase
  }

  private async wasIdentityRequestedForErasure(
    identity: IMemberIdentity,
  ): Promise<{ id: string } | null> {
    if (!identity.value) {
      return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      type: identity.type,
      value: identity.value.toLowerCase(),
    }
    const conditions: string[] = ['r.type = $(type)', 'lower(r.value) = $(value)']

    if (identity.type !== MemberIdentityType.EMAIL) {
      conditions.push('r.platform = $(platform)')
      params.platform = identity.platform
    }

    const query = `
      select r.id from "requestedForErasureMemberIdentities" r
      where
        ${conditions.join(' and ')}
      limit 1
    `

    return await this.db().oneOrNone(query, params)
  }
}
