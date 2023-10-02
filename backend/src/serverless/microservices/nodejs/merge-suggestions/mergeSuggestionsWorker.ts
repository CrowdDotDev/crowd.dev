import { getOpensearchClient } from '@crowd/opensearch'
import { OrganizationMergeSuggestionType } from '@crowd/types'
import getUserContext from '../../../../database/utils/getUserContext'
import MemberService from '../../../../services/memberService'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import {
  IMemberMergeSuggestionsType,
  IMemberMergeSuggestion,
} from '../../../../database/repositories/types/memberTypes'
import SegmentService from '../../../../services/segmentService'
import OrganizationService from '@/services/organizationService'
import { OPENSEARCH_CONFIG } from '@/conf'

async function mergeSuggestionsWorker(tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  const segmentService = new SegmentService(userContext)
  const { rows: segments } = await segmentService.querySubprojects({})
  userContext.currentSegments = segments
  userContext.opensearch = getOpensearchClient(OPENSEARCH_CONFIG)

  const memberService = new MemberService(userContext)
  // Splitting these because in the near future we will be treating them differently
  const byUsername: IMemberMergeSuggestion[] = await memberService.getMergeSuggestions(
    IMemberMergeSuggestionsType.USERNAME,
  )
  await memberService.addToMerge(byUsername)
  const byEmail: IMemberMergeSuggestion[] = await memberService.getMergeSuggestions(
    IMemberMergeSuggestionsType.EMAIL,
  )
  await memberService.addToMerge(byEmail)
  const bySimilarity: IMemberMergeSuggestion[] = await memberService.getMergeSuggestions(
    IMemberMergeSuggestionsType.SIMILARITY,
  )
  await memberService.addToMerge(bySimilarity)

  const organizationService = new OrganizationService(userContext)
  await organizationService.generateMergeSuggestions(OrganizationMergeSuggestionType.BY_IDENTITY)

}

export { mergeSuggestionsWorker }
