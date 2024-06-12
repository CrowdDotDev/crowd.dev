import moment from 'moment'

import { distinct, groupBy } from '@crowd/common'
import {
  IMember,
  IOrganizationIdentity,
  MemberIdentityType,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import {
  addMemberToMerge,
  deleteMemberOrg,
  findExistingMember,
  findMemberOrgs,
  insertOrgIdentity,
  insertWorkExperience,
  insertOrganization,
  findOrganizationByVerifiedIdentity,
  findOrganizationIdentities,
  updateOrgIdentity,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import { svc } from '../main'
import { EnrichingMember } from '../types/enrichment'
import { normalize } from '../utils/normalize'

/*
normalizeEnrichedMember is a Temporal activity that, given a member and enriched
data received, normalizes and updates all the member's fields/attributes in the
database.
*/
export async function normalizeEnrichedMember(input: EnrichingMember): Promise<IMember> {
  let member: IMember

  try {
    await svc.postgres.writer.connection().tx(async (tx) => {
      try {
        member = await normalize(tx, input.member, input.enrichment)
      } catch (err) {
        throw new Error(err)
      }
    })
  } catch (err) {
    throw new Error(err)
  }

  return member
}

/*
updateMergeSuggestions is a Temporal activity that update member merge suggestions
in the database for a member and enriched data received.
*/
export async function updateMergeSuggestions(input: EnrichingMember): Promise<void> {
  const usernameIdentities = input.member.identities.filter(
    (i) => i.type === MemberIdentityType.USERNAME,
  )

  if (usernameIdentities.length > 0) {
    await svc.postgres.writer.connection().tx(async (tx) => {
      const platformGroups = groupBy(usernameIdentities, (i) => i.platform)

      for (const [platform, identities] of platformGroups) {
        const values = distinct(identities.map((i) => i.value))

        // Check if any members with this username already exists.
        const existingMembers = await findExistingMember(
          svc.postgres.reader,
          input.member.id,
          input.member.tenantId,
          platform,
          values,
          MemberIdentityType.USERNAME,
        )

        for (const memberId of existingMembers) {
          await addMemberToMerge(tx, input.member.id, memberId)
        }
      }
    })
  }

  const emailIdentities = input.member.identities.filter((i) => i.type === MemberIdentityType.EMAIL)

  if (emailIdentities.length > 0) {
    await svc.postgres.writer.connection().tx(async (tx) => {
      const platformGroups = groupBy(emailIdentities, (i) => i.platform)

      for (const [platform, identities] of platformGroups) {
        const values = distinct(identities.map((i) => i.value))

        // Check if any members with this email already exists.
        const existingMembers = await findExistingMember(
          svc.postgres.reader,
          input.member.id,
          input.member.tenantId,
          platform,
          values,
          MemberIdentityType.EMAIL,
        )

        for (const memberId of existingMembers) {
          await addMemberToMerge(tx, input.member.id, memberId)
        }
      }
    })
  }
}

/*
updateOrganizations is a Temporal activity that update organizations in the
database thanks to enriched data received:
  - upsert organization
  - upsert `memberOrganization` relation
*/
export async function updateOrganizations(input: EnrichingMember): Promise<string[]> {
  const organizations: string[] = []
  if (input.enrichment.work_experiences) {
    try {
      await svc.postgres.writer.connection().tx(async (tx) => {
        for (const workExperience of input.enrichment.work_experiences) {
          const identities: IOrganizationIdentity[] = [
            {
              platform: PlatformType.LINKEDIN,
              value: workExperience.companyUrl,
              type: OrganizationIdentityType.PRIMARY_DOMAIN,
              verified: true,
            },
            {
              platform: PlatformType.LINKEDIN,
              value: `company:${workExperience.companyLinkedInUrl.split('/').pop()}`,
              type: OrganizationIdentityType.USERNAME,
              verified: true,
            },
          ]

          // find existing org by identity
          let organizationId
          for (const i of identities) {
            organizationId = await findOrganizationByVerifiedIdentity(tx, input.member.tenantId, i)
          }

          if (!organizationId) {
            organizationId = await insertOrganization(
              tx,
              input.member.tenantId,
              workExperience.company,
              workExperience.location,
            )
          }

          organizations.push(organizationId)

          // find existing identities
          const existingIdentities = await findOrganizationIdentities(tx, organizationId)

          for (const i of identities) {
            const existing = existingIdentities.find(
              (oi) => oi.platform === i.platform && oi.type === i.type && oi.value === i.value,
            )

            if (!existing) {
              await insertOrgIdentity(tx, organizationId, input.member.tenantId, i)
            } else if (existing.verified != i.verified) {
              await updateOrgIdentity(tx, organizationId, input.member.tenantId, i)
            }
          }

          const dateEnd = workExperience.endDate
            ? moment.utc(workExperience.endDate).toISOString()
            : null

          const data = {
            memberId: input.member.id,
            organizationId,
            title: workExperience.title,
            dateStart: workExperience.startDate,
            dateEnd,
            source: OrganizationSource.ENRICHMENT,
          }

          // Clean up organizations without dates if we're getting ones with dates.
          if (data.dateStart) {
            await deleteMemberOrg(tx, input.member.id, organizationId)
          } else {
            const rows = await findMemberOrgs(svc.postgres.reader, input.member.id, organizationId)
            const row = rows[0]

            // If we're getting organization without dates, but there's already
            // one with dates, don't insert
            if (row.count > 0) {
              return
            }
          }

          await insertWorkExperience(
            tx,
            input.member.id,
            organizationId,
            data.title,
            data.dateStart,
            data.dateEnd,
            data.source,
          )
        }
      })
    } catch (err) {
      throw new Error(err)
    }
  }

  return organizations
}
