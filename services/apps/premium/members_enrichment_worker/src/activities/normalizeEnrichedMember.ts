import moment from 'moment'

import { IMember, IOrganizationIdentity, OrganizationSource, PlatformType } from '@crowd/types'

import { svc } from '../main'
import { normalize } from '../utils/normalize'
import { EnrichingMember } from '../types/enrichment'
import {
  addMemberToMerge,
  deleteMemberOrg,
  findExistingMember,
  findMemberOrgs,
  insertOrgIdentity,
  insertWorkExperience,
  upsertOrg,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'

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
export async function updateMergeSuggestions(input: EnrichingMember): Promise<IMember> {
  if (input.member.username) {
    try {
      await svc.postgres.writer.connection().tx(async (tx) => {
        const filteredUsername = Object.keys(input.member.username).reduce((obj, key) => {
          if (!input.member.username[key]) {
            obj[key] = input.member.username[key]
          }
          return obj
        }, {})

        for (const [platform, usernames] of Object.entries(filteredUsername)) {
          const usernameArray = Array.isArray(usernames) ? usernames : [usernames]

          for (const username of usernameArray) {
            const usernames: string[] = []
            if (typeof username === 'string') {
              usernames.push(username)
            } else if (typeof username === 'object') {
              if ('username' in username) {
                usernames.push(username.username)
              } else if (platform in username) {
                if (typeof username[platform] === 'string') {
                  usernames.push(username[platform])
                } else if (Array.isArray(username[platform])) {
                  if (username[platform].length === 0) {
                    // throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
                  } else if (typeof username[platform] === 'string') {
                    usernames.push(...username[platform])
                  } else if (typeof username[platform][0] === 'object') {
                    usernames.push(...username[platform].map((u) => u.username))
                  }
                } else if (typeof username[platform] === 'object') {
                  usernames.push(username[platform].username)
                } else {
                  // throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
                }
              } else {
                // throw new Error400(this.options.language, 'activity.platformAndUsernameNotMatching')
              }
            }

            // Check if a member with this username already exists.
            const existingMember = await findExistingMember(
              svc.postgres.reader,
              input.member.tenantId,
              platform,
              usernames,
            )

            // Add the member to merge suggestions.
            if (existingMember) {
              await addMemberToMerge(tx, input.member.id, existingMember.id)

              // Filter out the identity that belongs to another member from the normalized payload
              if (Array.isArray(input.member.username[platform])) {
                input.member.username[platform] = input.member.username[platform].filter(
                  (u) => u !== username,
                )
              } else if (typeof input.member.username[platform] === 'string') {
                delete input.member.username[platform]
              } else {
                throw new Error(
                  `Unsupported data type for input.member.username[platform] "${input.member.username[platform]}".`,
                )
              }
            }
          }
        }
      })
    } catch (err) {
      throw new Error(err)
    }
  }

  return input.member
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
