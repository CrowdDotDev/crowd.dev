import EagleEyeActionRepository from '../database/repositories/eagleEyeActionRepository'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import Error404 from '../errors/Error404'
import { EagleEyeAction, EagleEyeActionType } from '../types/eagleEyeTypes'
import { IServiceOptions } from './IServiceOptions'
import { LoggingBase } from './loggingBase'
import track from '../segment/telemetryTrack'

export default class EagleEyeActionService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  async create(data: EagleEyeAction, contentId: string): Promise<EagleEyeAction | null> {
    const transaction = await SequelizeRepository.createTransaction(this.options)

    // find content
    const content = await EagleEyeContentRepository.findById(contentId, {
      ...this.options,
      transaction,
    })

    if (!content) {
      throw new Error404(this.options.language, 'errors.eagleEye.contentNotFound')
    }

    const existingUserActions: EagleEyeAction[] = content.actions.filter(
      (a) => a.actionById === this.options.currentUser.id,
    )

    const existingUserActionTypes = existingUserActions.map((a) => a.type)

    try {
      // check if already bookmarked - if yes ignore the new action and return existing
      if (
        data.type === EagleEyeActionType.BOOKMARK &&
        existingUserActionTypes.includes(EagleEyeActionType.BOOKMARK)
      ) {
        return existingUserActions.find((a) => a.type === EagleEyeActionType.BOOKMARK)
      }

      // thumbs up and down should be mutually exclusive
      if (
        data.type === EagleEyeActionType.THUMBS_DOWN &&
        existingUserActionTypes.includes(EagleEyeActionType.THUMBS_UP)
      ) {
        await EagleEyeActionRepository.removeActionFromContent(
          EagleEyeActionType.THUMBS_UP,
          contentId,
          this.options,
        )
      } else if (
        data.type === EagleEyeActionType.THUMBS_UP &&
        existingUserActionTypes.includes(EagleEyeActionType.THUMBS_DOWN)
      ) {
        await EagleEyeActionRepository.removeActionFromContent(
          EagleEyeActionType.THUMBS_DOWN,
          contentId,
          this.options,
        )
      }

      // add new action
      const record = await EagleEyeActionRepository.createActionForContent(
        data,
        contentId,
        this.options,
      )

      await SequelizeRepository.commitTransaction(transaction)

      // Tracking here so we have access to url and platform
      track(
        `Eagle Eye post ${record.type === EagleEyeActionType.BOOKMARK ? 'bookmark' : 'feedback'}`,
        {
          type: record.type,
          url: content.url,
          platform: content.platform,
          action: 'create',
        },
        { ...this.options },
      )

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'EagleEyeContent')

      throw error
    }
  }

  async destroy(id: string) {
    const action = await EagleEyeActionRepository.findById(id, this.options)

    const contentId = action.contentId

    await EagleEyeActionRepository.destroy(id, this.options)

    // find content
    const content = await EagleEyeContentRepository.findById(contentId, this.options)

    // if content no longer has any actions attached to it, also delete the content
    if (content.actions.length === 0) {
      await EagleEyeContentRepository.destroy(contentId, this.options)
    }

    // Tracking here so we have access to url and platform
    track(
      `Eagle Eye post ${action.type === EagleEyeActionType.BOOKMARK ? 'bookmark' : 'feedback'}`,
      {
        type: action.type,
        url: content.url,
        platform: content.platform,
        action: 'destroy',
      },
      { ...this.options },
    )
  }
}
