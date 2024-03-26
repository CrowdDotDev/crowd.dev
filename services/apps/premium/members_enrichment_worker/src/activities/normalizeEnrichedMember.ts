import moment from 'moment'

import { distinct, groupBy } from '@crowd/common'
import {
  IMember,
  IOrganizationIdentity,
  MemberIdentityType,
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
  upsertOrg,
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
          const org = await upsertOrg(
            tx,
            input.member.tenantId,
            workExperience.company,
            workExperience.companyUrl,
            workExperience.companyLinkedInUrl,
            workExperience.location,
          )

          organizations.push(org[0].id)

          const organizationIdentities: IOrganizationIdentity[] = [
            {
              name: workExperience.company,
              platform: PlatformType.ENRICHMENT,
            },
          ]

          if (workExperience.companyLinkedInUrl) {
            organizationIdentities.push({
              name: workExperience.companyLinkedInUrl.split('/').pop(),
              platform: PlatformType.LINKEDIN,
              url: workExperience.companyLinkedInUrl,
            })
          }

          for (const orgIdentity of organizationIdentities) {
            await insertOrgIdentity(
              tx,
              org[0].id,
              input.member.tenantId,
              orgIdentity.name,
              orgIdentity.platform,
              orgIdentity.url,
            )
          }

          const dateEnd = workExperience.endDate
            ? moment.utc(workExperience.endDate).toISOString()
            : null

          const data = {
            memberId: input.member.id,
            organizationId: org[0].id,
            title: workExperience.title,
            dateStart: workExperience.startDate,
            dateEnd,
            source: OrganizationSource.ENRICHMENT,
          }

          // Clean up organizations without dates if we're getting ones with dates.
          if (data.dateStart) {
            await deleteMemberOrg(tx, input.member.id, org[0].id)
          } else {
            const rows = await findMemberOrgs(svc.postgres.reader, input.member.id, org[0].id)
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
            org[0].id,
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
