import getUserContext from '../../../../database/utils/getUserContext'
import MemberService from '../../../../services/memberService'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import { createServiceChildLogger } from '../../../../utils/logging'
import { IMemberMergeAllSuggestions } from '../../../../database/repositories/types/memberTypes'

const log = createServiceChildLogger('mergeSuggestionsWorker')

async function mergeSuggestionsWorker(tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  const memberService = new MemberService(userContext)
  const suggestions: IMemberMergeAllSuggestions = await memberService.getMergeSuggestions()
  // Splitting these because in the near future we will be treating them differently
  await memberService.addToMerge(suggestions.byUsername)
  await memberService.addToMerge(suggestions.byEmail)
  await memberService.addToMerge(suggestions.bySimilarity)
}

export { mergeSuggestionsWorker }
