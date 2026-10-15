import { test as base, describe, expect } from 'vitest'

import { withQx } from '@crowd/test-kit/db'

import {
  claimSlackOnboardingRequestDone,
  findSlackOnboardingRequest,
  upsertSlackOnboardingRequest,
} from './slackOnboardingRequests'

const test = withQx(base)

const sourceUrl = 'https://acme.slack.com/archives/C1/p1760000000123456'
const header = {
  lines: ['📘 acme/one is already in LFX Insights under *Acme*. Nothing else to do.'],
  buttons: [{ text: 'View Acme in LFX Insights', url: 'https://insights.test/project/acme' }],
  alreadyTracked: 1,
}

describe('slackOnboardingRequests', () => {
  test('stores the status message of a request and reads it back by its source url', async ({
    qx,
  }) => {
    const stored = await upsertSlackOnboardingRequest(qx, {
      sourceUrl,
      channel: 'C1',
      messageTs: '1760000000.200000',
      header,
    })

    expect(stored).toMatchObject({
      sourceUrl,
      channel: 'C1',
      messageTs: '1760000000.200000',
      header,
    })
    expect(stored.doneNotifiedAt).toBeNull()
    expect(await findSlackOnboardingRequest(qx, sourceUrl)).toMatchObject({ header })
    expect(await findSlackOnboardingRequest(qx, 'https://acme.slack.com/archives/C1/p0')).toBeNull()
  })

  test('a re-run replaces the message and reopens the done notice', async ({ qx }) => {
    await upsertSlackOnboardingRequest(qx, { sourceUrl, channel: 'C1', messageTs: '1.1', header })
    expect(await claimSlackOnboardingRequestDone(qx, sourceUrl)).toBe(true)
    expect(await claimSlackOnboardingRequestDone(qx, sourceUrl)).toBe(false)

    const replaced = await upsertSlackOnboardingRequest(qx, {
      sourceUrl,
      channel: 'C1',
      messageTs: '2.2',
      header: { lines: [], buttons: [], alreadyTracked: 0 },
    })

    expect(replaced.messageTs).toBe('2.2')
    expect(replaced.header).toEqual({ lines: [], buttons: [], alreadyTracked: 0 })
    expect(await claimSlackOnboardingRequestDone(qx, sourceUrl)).toBe(true)
  })
})
