import { UnleashClient } from 'unleash-proxy-client'
import config from '@/config'

export const FEATURE_FLAGS = {
  eagleEye: 'eagle-eye',
  communityCenterPro: 'community-help-center-pro',
  organizations: 'organizations',
  automations: 'automations',
  linkedin: 'linkedin'
}

export class Unleash {
  constructor() {
    const unleashConfig = {
      url: `${config.unleash.url}/api/frontend`,
      clientKey: config.unleash.apiKey,
      appName: 'crowd-web-app',
      environment: 'production'
    }

    this.flags = FEATURE_FLAGS
    this.unleash = new UnleashClient(unleashConfig)
  }

  init(context) {
    this.unleash.start()

    this.updateContext(context)

    this.unleash.on('ready', () => {
      console.log('unleash ready')
      console.log('toggles', this.unleash.getAllToggles())
    })
  }

  isFlagEnabled(flag) {
    return this.unleash.isEnabled(flag)
  }

  updateContext(context) {
    this.unleash.updateContext(context)
  }

  premiumFeatureCopy() {
    if (config.isCommunityVersion) {
      return 'Premium'
    } else {
      return 'Growth'
    }
  }
}

export const UnleashInstance = new Unleash()
