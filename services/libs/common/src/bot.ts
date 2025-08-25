import { knownBots } from './constants'

export function isKnownBot(value: string): boolean {
  return knownBots.has(value.toLowerCase())
}
