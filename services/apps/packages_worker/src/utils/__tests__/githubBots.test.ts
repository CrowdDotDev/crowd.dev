import { describe, expect, it } from 'vitest'

import { isBotAccount, isBotLogin, matchesBotToken } from '../githubBots'

describe('isBotLogin', () => {
  it('flags [bot] suffixes and known bot tokens', () => {
    expect(isBotLogin('dependabot[bot]')).toBe(true)
    expect(isBotLogin('Renovate-Bot')).toBe(true)
    expect(isBotLogin('github-actions')).toBe(true)
  })

  it('keeps ordinary logins', () => {
    expect(isBotLogin('dougwilson')).toBe(false)
  })
})

describe('matchesBotToken', () => {
  it('matches emails that embed a bot token', () => {
    expect(matchesBotToken('noreply@copilot.example')).toBe(true)
    expect(matchesBotToken('jane@example.com')).toBe(false)
  })
})

describe('isBotAccount', () => {
  it('flags GitHub type Bot regardless of login', () => {
    expect(isBotAccount('someone', 'Bot')).toBe(true)
  })

  it('flags bot logins regardless of type', () => {
    expect(isBotAccount('dependabot[bot]', 'User')).toBe(true)
  })

  it('keeps users with ordinary logins', () => {
    expect(isBotAccount('dougwilson', 'User')).toBe(false)
  })
})
