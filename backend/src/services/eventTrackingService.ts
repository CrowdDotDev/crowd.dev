import { IServiceOptions } from './IServiceOptions'
import { LoggingBase } from './loggingBase'
import track from '../segment/track'
import { Event } from '../types/eventTrackingTypes'

export default class EventTrackingService extends LoggingBase {
  options: IServiceOptions

  constructor(options) {
    super(options)
    this.options = options
  }

  async trackEvent(event: Event) {
    await track(event.name, event.properties, this.options)
    console.log('trackEvent', event)
  }
}
