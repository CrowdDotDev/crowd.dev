import getUserContext from '../../../../database/utils/getUserContext'
import MemberService from '../../../../services/memberService'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import { IMemberMergeSuggestionsType } from '../../../../database/repositories/types/memberTypes'
import SegmentService from '../../../../services/segmentService'

async function mergeSuggestionsWorker(tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  const segmentService = new SegmentService(userContext)
  const { rows: segments } = await segmentService.querySubprojects({})
  userContext.currentSegments = segments

  const memberService = new MemberService(userContext)
  // Splitting these because in the near future we will be treating them differently
  await Promise.all([
    memberService.getMergeSuggestions(IMemberMergeSuggestionsType.USERNAME),
    memberService.getMergeSuggestions(IMemberMergeSuggestionsType.EMAIL),
    memberService.getMergeSuggestions(IMemberMergeSuggestionsType.SIMILARITY),
  ])
}

export { mergeSuggestionsWorker }
