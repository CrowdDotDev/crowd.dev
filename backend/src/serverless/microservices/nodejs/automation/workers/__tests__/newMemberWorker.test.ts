import {
  AutomationData,
  AutomationState,
  AutomationTrigger,
  AutomationType,
  NewMemberSettings,
} from '../../../../../../types/automationTypes'
import { PlatformType } from '../../../../../../utils/platforms'
import { shouldProcessMember } from '../newMemberWorker'

function createAutomationData(settings: NewMemberSettings): AutomationData {
  return {
    id: '123',
    state: AutomationState.ACTIVE,
    trigger: AutomationTrigger.NEW_MEMBER,
    settings,
    type: AutomationType.WEBHOOK,
    createdAt: new Date().toISOString(),
    tenantId: '321',
    lastExecutionAt: null,
    lastExecutionError: null,
    lastExecutionState: null,
  }
}

describe('New Member Automation Worker tests', () => {
  it('Should process a worker that matches settings', () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DISCORD],
    })

    const member = {
      id: '1234',
      username: {
        [PlatformType.DISCORD]: 'discordUsername',
      },
    }

    expect(shouldProcessMember(member, automation)).toBeTruthy()
  })

  it("Shouldn't process a worker that does not match settings", () => {
    const automation = createAutomationData({
      platforms: [PlatformType.DEVTO],
    })

    const member = {
      id: '1234',
      username: {
        [PlatformType.DISCORD]: 'discordUsername',
      },
    }

    expect(shouldProcessMember(member, automation)).toBeFalsy()
  })
})
