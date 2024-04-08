import { IMember, MemberIdentityType, PlatformType } from '@crowd/types'
import { proxyActivities } from '@temporalio/workflow'
import * as activities from '../../activities'
import { ILFIDEnrichmentGithubProfile } from '../../types/lfid-enrichment'

const {
  refreshToken,
  getEnrichmentLFAuth0,
  getIdentitiesExistInOtherMembers,
  updateMemberWithEnrichmentData,
  syncMembersToOpensearch,
  mergeMembers,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '2 seconds',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
})

export async function enrichMemberWithLFAuth0(member: IMember): Promise<void> {
  const token = await refreshToken()
  const enriched = await getEnrichmentLFAuth0(token, member)

  if (enriched) {
    console.log(`Member ${member.id} found in the lf auth0 enrichment db!`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized: any = {}
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
        platform: PlatformType.LFID,
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
          i.platform === PlatformType.LFID &&
          i.value === enriched.username,
      )
    ) {
      identitiesToCheck.push({
        platform: PlatformType.LFID,
        type: MemberIdentityType.USERNAME,
        value: enriched.username,
        verified: true,
      })
    }

    // github
    // check if there's a github profile in the enriched data
    const enrichmentGithub = enriched.identities.find((i) => i.provider === PlatformType.GITHUB)

    console.log(enrichmentGithub)

    if (enrichmentGithub && enrichmentGithub.profileData) {
      if (
        !member.identities.some(
          (i) =>
            i.type === MemberIdentityType.USERNAME &&
            i.platform === PlatformType.GITHUB &&
            i.value === enrichmentGithub.profileData.nickname,
        )
      ) {
        identitiesToCheck.push({
          type: MemberIdentityType.USERNAME,
          platform: PlatformType.GITHUB,
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
          // check if we haven't already added this email to identitiesToCheck
          !identitiesToCheck.some(
            (i) => i.type === MemberIdentityType.EMAIL && i.value === githubEmail.email,
          )
        ) {
          identitiesToCheck.push({
            platform: PlatformType.GITHUB,
            type: MemberIdentityType.EMAIL,
            value: githubEmail.email,
            verified: true,
          })
        }
      }
    }

    // for each identities to check, we should check if they already exist in some other member
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

    // update current member with enrichment data
    await updateMemberWithEnrichmentData(
      member.id,
      member.tenantId,
      identitesToAdd,
      normalized.attributes,
    )

    await syncMembersToOpensearch([member.id])

    for (const memberToBeMerged of identitiesExistInOtherMembers) {
      console.log(`${memberToBeMerged.memberId} will be merged with ${member.id}`)
      await mergeMembers(member.id, memberToBeMerged.memberId, member.tenantId)
    }
  }
}
