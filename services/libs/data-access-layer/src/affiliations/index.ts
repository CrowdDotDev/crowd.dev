import { DbStore } from '@crowd/database'

export async function processAffiliationTimeline() {
  // TODO: Implement this
}

export async function processFallbackActivityRelations() {
  // TODO: Implement this
}

export async function refreshMemberOrganizationAffiliations(pgDb: DbStore, memberId: string) {
  // const qx = pgpQx(pgDb.connection())
  // const start = performance.now()
  // const timelines = await prepareMemberOrganizationAffiliationTimeline(qx, memberId)
  // if (timelines.length === 0) {
  //   logger.info({ memberId }, 'No valid timelines found for member, skipping affiliation refresh!')
  //   return
  // }
  // ?? Previously, figureOutNewOrgId handled org assignment by setting a fallback or null for activities outside memberOrg timelines. With the new approach, how are we handling activities that don't fit any memberOrg timeline now?
  // ?? check if we handle conflicts in prepareMemberOrganizationAffiliationTimeline function like we do in prepareMemberAffiliationsUpdate? make sure we dont break any of the existing conflict handling and stuff and dont introduce new bugs. just fix that if needed and give me prepareMemberOrganizationAffiliationTimeline alone
  // process timelines in parallel
  // const results = await Promise.all(
  //   timelines.map((timeline) => processAffiliationTimeline(qDb, qx, memberId, timeline)),
  // )
  // const duration = performance.now() - start
  // const processed = results.reduce((acc, processed) => acc + processed, 0)
  // logger.info(`Updated ${processed} activities in ${duration}ms`)
}
