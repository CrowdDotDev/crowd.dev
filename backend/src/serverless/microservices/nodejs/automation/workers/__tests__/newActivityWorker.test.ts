import {
  AutomationData,
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewActivitySettings,
} from '../../../../../../types/automationTypes'
import { PlatformType } from '../../../../../../types/integrationEnums'
import { shouldProcessActivity } from '../newActivityWorker'

function createAutomationData(settings: NewActivitySettings): AutomationData {
  return {
    id: '123',
    state: AutomationState.ACTIVE,
    trigger: AutomationTrigger.NEW_ACTIVITY,
    settings,
    type: AutomationType.WEBHOOK,
    createdAt: new Date().toISOString(),
    tenantId: '321',
    lastExecutionAt: null,
    lastExecutionError: null,
    lastExecutionState: null,
  }
}

describe('New Activity Automation Worker tests', () => {
  it('Should process an activity that matches settings', () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
      types: ['comment'],
      keywords: ['Crowd.dev'],
      teamMemberActivities: false,
    })

    const activity = {
      id: '1234',
      type: 'comment',
      platform: PlatformType.DEVTO,
      body: 'Crowd.dev is awesome!',
      member: {
        attributes: {},
      },
    }

    expect(shouldProcessActivity(activity, automation)).toBeTruthy()
  })

  it('Shouldn process an activity that belongs to a team member', () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
      types: ['comment'],
      keywords: ['Crowd.dev'],
      teamMemberActivities: true,
    })

    const activity = {
      id: '1234',
      type: 'comment',
      platform: PlatformType.DEVTO,
      member: {
        attributes: {
          isTeamMember: {
            custom: true,
          },
        },
      },

      body: 'Crowd.dev all awesome!',
    }

    expect(shouldProcessActivity(activity, automation)).toBeTruthy()
  })

  it("Shouldn't process an activity which platform does not match", () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
      types: ['comment'],
      keywords: ['Crowd.dev'],
      teamMemberActivities: false,
    })

    const activity = {
      id: '1234',
      type: 'comment',
      platform: PlatformType.DISCORD,

      body: 'Crowd.dev is awesome!',
    }

    expect(shouldProcessActivity(activity, automation)).toBeFalsy()
  })

  it("Shouldn't process an activity which type does not match", () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
      types: ['comment'],
      keywords: ['Crowd.dev'],
      teamMemberActivities: false,
    })

    const activity = {
      id: '1234',
      type: 'follow',
      platform: PlatformType.DEVTO,
      body: 'Crowd.dev is awesome!',
    }

    expect(shouldProcessActivity(activity, automation)).toBeFalsy()
  })

  it("Shouldn't process an activity which keyword does not match", () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
      types: ['comment'],
      keywords: ['Crowd.dev'],
      teamMemberActivities: false,
    })

    const activity = {
      id: '1234',
      type: 'comment',
      platform: PlatformType.DEVTO,
      body: 'We are all awesome!',
    }

    expect(shouldProcessActivity(activity, automation)).toBeFalsy()
  })

  it("Shouldn't process an activity that belongs to a team member", () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
      types: ['comment'],
      keywords: ['Crowd.dev'],
      teamMemberActivities: false,
    })

    const activity = {
      id: '1234',
      type: 'comment',
      platform: PlatformType.DEVTO,
      member: {
        attributes: {
          isTeamMember: {
            custom: true,
          },
        },
      },
      body: 'Crowd.dev all awesome!',
    }

    expect(shouldProcessActivity(activity, automation)).toBeFalsy()
  })
})
