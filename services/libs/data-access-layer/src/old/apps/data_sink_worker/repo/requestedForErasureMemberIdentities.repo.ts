import { generateUUIDv1 } from '@crowd/common'
import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IMemberData, IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { anonymizeUsername } from '../../../../gdpr'

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

  private async insertIdentityForErasureRequest({
    platform,
    type,
    value,
    memberId,
  }): Promise<void> {
    const query = `
    insert into "requestedForErasureMemberIdentities" (id, platform, type, value, memberId)
    values ($(id), $(platform), $(type), $(value), $(memberId))
    `

    return await this.db().none(query, {
      id: generateUUIDv1(),
      platform,
      type,
      value,
      memberId,
    })
  }

  public async updateErasureRequestMemberId(
    identity: IMemberIdentity,
    memberId: string,
  ): Promise<void> {
    const query = `
      update "requestedForErasureMemberIdentities"
      set "memberId" = $(memberId)
      where value = $(value)
    `

    await this.db().none(query, {
      memberId,
      value: identity.value,
    })
  }

  public async getAnonymizationRequest({
    value,
    platform,
    type,
    hashValue = false,
  }): Promise<{ id: string; memberId: string; value: string } | null> {
    // hash the value only if flag is set
    if (hashValue) {
      value = anonymizeUsername(value, platform, type)
    }

    const result = await this.db().oneOrNone(
      `
      select r.id, r."memberId"
      from "requestedForErasureMemberIdentities" r
      where r.value = $(value) and r."platform" = $(platform) and r."type" = $(type) 
      limit 1
    `,
      {
        value,
        platform,
        type,
      },
    )

    if (!result) {
      return null
    }

    return {
      ...result,
      value,
    }
  }

  public async anonymizeMemberIfRequested(member: IMemberData): Promise<IMemberData | null> {
    const identitiesRequestedForAnonymization = []
    const otherIdentitiesYetToBeAnonymized = []
    let existingAnonymousMemberId: string | null = null

    const hashedIdentities = member.identities.map((identity) => ({
      ...identity,
      value: anonymizeUsername(identity.value, identity.platform, identity.type),
    }))

    // check all identities for anonymization request
    for (const identity of hashedIdentities) {
      const anonReq = await this.getAnonymizationRequest({
        value: identity.value,
        platform: identity.platform,
        type: identity.type,
      })

      if (anonReq) {
        // identity is marked for anonymization
        identitiesRequestedForAnonymization.push(anonReq)

        if (anonReq.memberId) {
          existingAnonymousMemberId = anonReq.memberId
        }
      } else {
        otherIdentitiesYetToBeAnonymized.push(identity)
      }
    }

    // no identities are marked for anonymization
    if (identitiesRequestedForAnonymization.length === 0) {
      return null
    }

    // when a member is blacklisted, we need to ensure all their identities are also blacklisted
    // eg: If github:johndoe is blacklisted, also blacklist linkedin:john-doe and email:john@doe.com.
    await Promise.all(
      otherIdentitiesYetToBeAnonymized.map((identity) =>
        this.insertIdentityForErasureRequest({
          platform: identity.platform,
          type: identity.type,
          value: identity.value,
          // we use the existing anonymous memberId if available to link identities to the same member
          // This happens when a blacklisted identity had no member in db at the time of blacklisting
          // If no memberId exists, we set it to null and handle it during processActivity member creation
          memberId: existingAnonymousMemberId,
        }),
      ),
    )

    return {
      ...member,
      identities: hashedIdentities,
      attributes: {},
    }
  }
}
