import lodash from 'lodash'
import {
  ActivityTypeDisplayProperties,
  ActivityTypeSettings,
  DiscordtoActivityType,
  UNKNOWN_ACTIVITY_TYPE_DISPLAY,
} from '../types/activityTypes'
import { PlatformType } from '../types/integrationEnums'
import { IServiceOptions } from './IServiceOptions'
import { LoggingBase } from './loggingBase'

export default class ActivityDisplayService extends LoggingBase {
  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options)
    this.options = options
  }

  static getInterpolatableVariables(
    string: string,
    interpolatableVariables: string[] = [],
  ): string[] {
    const interpolationStartIndex = string.indexOf('{')
    const interpolationEndIndex = string.indexOf('}')

    // we don't need processing if there's no opening/closing brackets, or when the string is empty
    if (interpolationStartIndex === -1 || interpolationEndIndex === -1 || string.length === 0) {
      return interpolatableVariables
    }

    const interpolationVariable = string.slice(interpolationStartIndex + 1, interpolationEndIndex)
    interpolatableVariables.push(interpolationVariable)

    return this.getInterpolatableVariables(
      string.slice(interpolationEndIndex + 1),
      interpolatableVariables,
    )
  }

  static interpolateVariables(
    displayOptions: ActivityTypeDisplayProperties,
    activity: any,
  ): ActivityTypeDisplayProperties {
    for (const key of Object.keys(displayOptions)) {
      if (typeof displayOptions[key] === 'string') {
        const displayVariables = this.getInterpolatableVariables(displayOptions[key])

        for (const dv of displayVariables) {
          const coalesceVariables = dv.split('|')
          let replacement = ''

          for (const variable of coalesceVariables) {
            const attribute = this.getAttribute(variable.trim(), activity)

            if (attribute) {
              replacement = attribute
              break
            }
          }

          if (displayOptions.formatter && displayOptions.formatter[dv]) {
            replacement = displayOptions.formatter[dv](replacement)
          }
          displayOptions[key] = displayOptions[key].replace(`{${dv}}`, replacement)
        }
      }
    }

    return displayOptions
  }

  static getAttribute(key: string, activity: any) {
    if (key === 'self') {
      return activity
    }

    const splitted = key.split('.')

    let attribute = activity

    for (const key of splitted) {
      try {
        attribute = attribute[key]
      } catch (error) {
        return null
      }
    }

    return attribute
  }

  static getDisplayOptions(
    activity: any,
    activityTypes: ActivityTypeSettings,
  ): ActivityTypeDisplayProperties {
    if (!activity || !activity.platform || !activity.type) {
      return UNKNOWN_ACTIVITY_TYPE_DISPLAY
    }

    const allActivityTypes = lodash.merge(activityTypes.custom, activityTypes.default)

    if (
      activity.platform === PlatformType.DISCORD &&
      activity.type === DiscordtoActivityType.MESSAGE &&
      activity.attributes.thread === true
    ) {
      activity.type = DiscordtoActivityType.THREAD_MESSAGE
    }

    // we're cloning because we'll use the same object to do the interpolation
    const displayOptions: ActivityTypeDisplayProperties =
      allActivityTypes[activity.platform] && allActivityTypes[activity.platform][activity.type]
        ? lodash.cloneDeep(allActivityTypes[activity.platform][activity.type].display)
        : null

    if (!displayOptions) {
      // return default display
      return UNKNOWN_ACTIVITY_TYPE_DISPLAY
    }

    return this.interpolateVariables(displayOptions, activity)
  }
}
