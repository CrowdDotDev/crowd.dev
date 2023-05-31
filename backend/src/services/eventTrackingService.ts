import { LoggerBase } from '@crowd/logging'
import track from '../segment/track'
import { Event } from '../types/eventTrackingTypes'
import { IServiceOptions } from './IServiceOptions'

export default class EventTrackingService extends LoggerBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  async trackEvent(event: Event) {
    await track(event.name, event.properties, this.options)
  }
}
