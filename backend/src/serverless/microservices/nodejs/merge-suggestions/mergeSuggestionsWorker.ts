import getUserContext from '../../../../database/utils/getUserContext'
import MemberService from '../../../../services/memberService'
import { IRepositoryOptions } from '../../../../database/repositories/IRepositoryOptions'
import { createServiceChildLogger } from '../../../../utils/logging'
import {
  IMemberMergeSuggestionsType,
  IMemberMergeSuggestion,
} from '../../../../database/repositories/types/memberTypes'

const log = createServiceChildLogger('mergeSuggestionsWorker')

async function mergeSuggestionsWorker(tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  const memberService = new MemberService(userContext)
  // Splitting these because in the near future we will be treating them differently
  const byUsername: IMemberMergeSuggestion[] = await memberService.getMergeSuggestions(
    IMemberMergeSuggestionsType.USERNAME,
  )
  log.info(`Merge suggestions: Found ${byUsername.length} merge suggestions by username`)
  await memberService.addToMerge(byUsername)
  const byEmail: IMemberMergeSuggestion[] = await memberService.getMergeSuggestions(
    IMemberMergeSuggestionsType.EMAIL,
  )
  log.info(`Merge suggestions: Found ${byEmail.length} merge suggestions by email`)
  await memberService.addToMerge(byEmail)
  const bySimilarity: IMemberMergeSuggestion[] = await memberService.getMergeSuggestions(
    IMemberMergeSuggestionsType.SIMILARITY,
  )
  log.info(`Merge suggestions: Found ${bySimilarity.length} merge suggestions by similarity`)
  await memberService.addToMerge(bySimilarity)
}

export { mergeSuggestionsWorker }
