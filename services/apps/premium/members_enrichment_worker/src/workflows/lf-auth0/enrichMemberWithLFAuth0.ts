import { IMember, MemberIdentityType } from '@crowd/types'
import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../../activities'
import { ILFIDEnrichmentGithubProfile } from '../../types/lfid-enrichment'

const { refreshToken, get, getIdentitiesExistInOtherMembers, enrich, syncMembersToOpensearch } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '2 minutes',
    retry: {
      initialInterval: '2 seconds',
      backoffCoefficient: 2,
      maximumAttempts: 3,
    },
  })

export async function enrichMemberWithLFAuth0(member: IMember): Promise<void> {
  const token = await refreshToken()
  const enriched = await get(token, member)

  if (enriched) {
    console.log(`Member ${member.id} found in the lf auth0 enrichment db!`)
    const normalized: any = {}
    // check logo TODO:: double check
    if (
      enriched.picture &&
      (!member.attributes?.avatarUrl || !member.attributes?.avatarUrl.default)
    ) {
      normalized.attributes = {
        ...member.attributes,
        avatarUrl: {
          default: enriched.picture,
          lfid: enriched.picture,
        },
      }
    }

    // find identities that doesn't exist in current member, and check if these identities already
    // exist in some other member

    const identitiesToCheck = []

    // email
    if (
      enriched.email &&
      !member.identities.some(
        (e) => e.type === MemberIdentityType.EMAIL && e.value === enriched.email,
      )
    ) {
      identitiesToCheck.push({
        type: MemberIdentityType.EMAIL,
        platform: 'lfid',
        value: enriched.email,
        verified: true,
      })
    }

    // lfid
    if (
      enriched.username &&
      !member.identities.some(
        (i) =>
          i.type === MemberIdentityType.USERNAME &&
          i.platform === 'lfid' &&
          i.value === enriched.username,
      )
    ) {
      identitiesToCheck.push({
        platform: 'lfid',
        type: MemberIdentityType.USERNAME,
        value: enriched.username,
        verified: true,
      })
    }

    // github
    // check if there's a github profile in the enriched data
    const enrichmentGithub = enriched.identities.find((i) => i.provider === 'github')

    if (enrichmentGithub) {
      if (
        !member.identities.some(
          (i) =>
            i.type === MemberIdentityType.USERNAME &&
            i.platform === 'github' &&
            i.value === enrichmentGithub.profileData.nickname,
        )
      ) {
        identitiesToCheck.push({
          type: MemberIdentityType.USERNAME,
          platform: 'github',
          value: enrichmentGithub.profileData.nickname,
          verified: true,
        })
      }
      // also github profile might come with emails, check if these exist yet in the member
      for (const githubEmail of (
        enrichmentGithub.profileData as ILFIDEnrichmentGithubProfile
      ).emails.filter((e) => e.verified)) {
        if (
          !member.identities.some(
            (e) => e.type === MemberIdentityType.EMAIL && e.value === githubEmail.email,
          ) &&
          !identitiesToCheck.some(
            (i) => i.type === MemberIdentityType.EMAIL && i.value === githubEmail.email,
          )
        ) {
          identitiesToCheck.push({
            platform: 'github',
            type: MemberIdentityType.EMAIL,
            value: githubEmail.email,
            verified: true,
          })
        }
      }
    }

    // for identities to check, we should check if they already exist in some other member
    // if they do, we keep track of this member, remove the identity from enrichment payload
    // and after enrichment is done, merge these two members together
    const identitiesExistInOtherMembers = await getIdentitiesExistInOtherMembers(
      member.tenantId,
      member.id,
      identitiesToCheck,
    )

    const identitesToAdd = identitiesToCheck.filter(
      (i) =>
        !identitiesExistInOtherMembers.some(
          (e) => e.type === i.type && e.platform === i.platform && e.value === i.value,
        ),
    )

    // add identities to current member.
    await enrich(member.id, member.tenantId, identitesToAdd, normalized.attributes)
    // loop through identitiesExistInOtherMembers and merge them with current member. Find the primary by counting the total number of identities.]

    await syncMembersToOpensearch([member.id])

    for (const memberToBeMerged of identitiesExistInOtherMembers) {
      // merge
      console.log(`${memberToBeMerged.memberId} will be merged with ${member.id}`)
    }
  }
}
