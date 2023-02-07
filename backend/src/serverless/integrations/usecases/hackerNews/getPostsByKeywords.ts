import { IServiceOptions } from '../../../../services/IServiceOptions'
import { EagleEyeResponses, EagleEyeInput } from '../../types/hackerNewsTypes'
import { Logger } from '../../../../utils/logging'
import { timeout } from '../../../../utils/timing'
import EagleEyeContentService from '../../../../services/eagleEyeContentService'

async function getPostsByKeyword(
  input: EagleEyeInput,
  options: IServiceOptions,
  logger: Logger,
): Promise<EagleEyeResponses> {
  await timeout(2000)

  try {
    const eagleEyeService = new EagleEyeContentService(options)
    return await eagleEyeService.keywordMatch({
      keywords: input.keywords,
      nDays: input.nDays,
      platform: 'hacker_news',
    })
  } catch (err) {
    logger.error({ err, input }, 'Error while getting posts by keyword in EagleEye')
    throw err
  }
}

export default getPostsByKeyword
