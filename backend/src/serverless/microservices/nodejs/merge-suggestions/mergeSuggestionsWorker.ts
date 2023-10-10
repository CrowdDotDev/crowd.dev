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
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('mergeSuggestionsWorker')

async function mergeSuggestionsWorker(tenantId): Promise<void> {
  const userContext: IRepositoryOptions = await getUserContext(tenantId)
  const segmentService = new SegmentService(userContext)
  const { rows: segments } = await segmentService.querySubprojects({})
  userContext.currentSegments = segments
  userContext.opensearch = getOpensearchClient(OPENSEARCH_CONFIG)

  log.info(`Generating organization merge suggestions for tenant ${tenantId}!`)

  const organizationService = new OrganizationService(userContext)
  await organizationService.generateMergeSuggestions(OrganizationMergeSuggestionType.BY_IDENTITY)

  log.info(`Done generating organization merge suggestions for tenant ${tenantId}!`)

  log.info(`Generating member merge suggestions for tenant ${tenantId}!`)

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
  log.info(`Done generating member merge suggestions for tenant ${tenantId}!`)
}

export { mergeSuggestionsWorker }
