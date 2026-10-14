const BOT_TOKENS = [
  'dependabot',
  'renovate',
  'github-actions',
  'claude',
  'anthropic',
  'copilot',
  'chatgpt',
  'openai',
]

export function matchesBotToken(value: string): boolean {
  const lower = value.toLowerCase()
  return BOT_TOKENS.some((token) => lower.includes(token))
}

function hasBotTokenSegment(login: string): boolean {
  return BOT_TOKENS.some((token) => new RegExp(`(^|[-_.\\[])${token}($|[-_.\\]])`).test(login))
}

export function isBotLogin(login: string): boolean {
  const lower = login.toLowerCase()
  if (lower.endsWith('[bot]')) return true
  return hasBotTokenSegment(lower)
}

export function isBotAccount(login: string, type: unknown): boolean {
  return type === 'Bot' || isBotLogin(login)
}
