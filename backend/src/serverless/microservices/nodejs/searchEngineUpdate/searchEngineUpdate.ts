import SequelizeRepository from '../../../../database/repositories/sequelizeRepository'
import ConversationService from '../../../../services/conversationService'

export const searchEngineUpdate = async (
  tenantId: string,
  conversationId: string,
): Promise<void> => {
  const options = await SequelizeRepository.getDefaultIRepositoryOptions(undefined, {
    id: tenantId,
  })
  const conversationService = new ConversationService(options)

  await conversationService.loadIntoSearchEngine(conversationId)
}
