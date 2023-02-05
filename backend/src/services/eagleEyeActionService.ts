import EagleEyeActionRepository from '../database/repositories/eagleEyeActionRepository'
import EagleEyeContentRepository from '../database/repositories/eagleEyeContentRepository'
import Error404 from '../errors/Error404'
import { EagleEyeAction, EagleEyeActionType } from '../types/eagleEyeTypes'
import { IServiceOptions } from './IServiceOptions'
import { LoggingBase } from './loggingBase'

export default class EagleEyeActionService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  async create(data: EagleEyeAction, contentId: string): Promise<EagleEyeAction | null> {
    // find content
    const content = await EagleEyeContentRepository.findById(contentId, this.options)

    if (!content) {
      throw new Error404('Content not found..')
    }

    const existingUserActions: EagleEyeAction[] = content.actions
      .filter((a) => a.actionById === this.options.currentUser.id)

    const existingUserActionTypes = existingUserActions.map((a) => a.type)

    // check if already bookmarked - if yes ignore the new action and return existing
     if (
       data.type === EagleEyeActionType.BOOKMARK &&
       existingUserActionTypes.includes(EagleEyeActionType.BOOKMARK)
     ) {
       return existingUserActions.find( (a) => a.type === EagleEyeActionType.BOOKMARK)
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
     return EagleEyeActionRepository.createActionForContent(data, contentId, this.options)
  }


  async destroy(id: string){

    const action = await EagleEyeActionRepository.findById(id, this.options)

    const contentId = action.contentId

    await EagleEyeActionRepository.destroy(id, this.options)

    // find content
    const content = await EagleEyeContentRepository.findById(contentId, this.options)

    // if content no longer has any actions attached to it, also delete the content
    if (content.actions.length === 0){
        await EagleEyeContentRepository.destroy(contentId, this.options)
    }
  }
}
