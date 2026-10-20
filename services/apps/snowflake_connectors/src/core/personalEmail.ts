import { cleanIdentityValue } from './transformerBase'

const NOREPLY_LOCAL_PARTS = new Set(['noreply', 'no-reply', 'donotreply', 'do-not-reply'])

const PLACEHOLDER_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
])

const MAILING_LIST_DOMAINS = new Set(['groups.io', 'googlegroups.com'])

const FREEMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'qq.com',
  '163.com',
])

const AUTOMATION_LOCAL_PARTS = new Set([
  'dependabot',
  'renovate',
  'ci',
  'jenkins',
  'github-actions',
  'actions',
])

const MEETING_ACCOUNT_LOCAL_PART = /^(zoom|meetings?)(\d+|-[a-z0-9]+)?$/

function isMailingList(domain: string): boolean {
  return domain.startsWith('lists.') || MAILING_LIST_DOMAINS.has(domain)
}

function isMeetingAccount(localPart: string, domain: string): boolean {
  return MEETING_ACCOUNT_LOCAL_PART.test(localPart) && !FREEMAIL_DOMAINS.has(domain)
}

function isAutomation(localPart: string): boolean {
  return (
    AUTOMATION_LOCAL_PARTS.has(localPart) ||
    localPart.endsWith('-bot') ||
    localPart.endsWith('[bot]')
  )
}

export function isSharedOrAutomatedEmail(email: string): boolean {
  const value = email.toLowerCase()
  const atIndex = value.lastIndexOf('@')
  if (atIndex < 0) {
    return false
  }
  const localPart = value.slice(0, atIndex).split('+')[0]
  const domain = value.slice(atIndex + 1)

  return (
    NOREPLY_LOCAL_PARTS.has(localPart) ||
    PLACEHOLDER_EMAIL_DOMAINS.has(domain) ||
    isMailingList(domain) ||
    isMeetingAccount(localPart, domain) ||
    isAutomation(localPart)
  )
}

export function cleanPersonalEmail(raw: unknown): string | null {
  const email = cleanIdentityValue(raw)
  return email && !isSharedOrAutomatedEmail(email) ? email : null
}
