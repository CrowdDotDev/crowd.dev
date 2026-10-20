import { describe, expect, it } from 'vitest'

import { cleanPersonalEmail, isSharedOrAutomatedEmail } from './personalEmail'

describe('isSharedOrAutomatedEmail', () => {
  it.each([
    'zoom@hyperledger.org',
    'zoom2@lfai.foundation',
    'zoom-admin@nephio.org',
    'Meetings@dpdk.org',
    'meeting1@seidengroup.com',
  ])('flags the shared meeting host account %s', (email) => {
    expect(isSharedOrAutomatedEmail(email)).toBe(true)
  })

  it.each(['cdf-toc@lists.cd.foundation', 'wg@groups.io', 'kubecon-team@googlegroups.com'])(
    'flags the mailing list %s',
    (email) => {
      expect(isSharedOrAutomatedEmail(email)).toBe(true)
    },
  )

  it.each([
    'noreply@github.com',
    'no-reply+events@pushfeedback.com',
    'student1@example.com',
    'cb-integration-bot@linuxfoundation.org',
    'jenkins@cd.foundation',
  ])('flags the noreply, placeholder or automation address %s', (email) => {
    expect(isSharedOrAutomatedEmail(email)).toBe(true)
  })

  it.each([
    'james.wang@zoom.us',
    'zoom201719@gmail.com',
    'zoom2arun@gmail.com',
    'mail@jkroepke.de',
    'hello@stevegiguere.com',
    'hans.bot@yenlo.com',
    'varun.pandey.bot@gmail.com',
    'vad1mo@users.noreply.github.com',
  ])('keeps the personal address %s', (email) => {
    expect(isSharedOrAutomatedEmail(email)).toBe(false)
  })
})

describe('cleanPersonalEmail', () => {
  it('trims and keeps a personal email', () => {
    expect(cleanPersonalEmail(' ada@lovelace.dev ')).toBe('ada@lovelace.dev')
  })

  it('drops a shared meeting host account', () => {
    expect(cleanPersonalEmail('zoom@hyperledger.org')).toBeNull()
  })

  it('drops a placeholder email value', () => {
    expect(cleanPersonalEmail('NONE')).toBeNull()
  })
})
