import { isKnownBot } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberIdentity, MemberBotDetection } from '@crowd/types'

export class BotDetectionService extends LoggerBase {
  // Explicit bot identifiers
  private static readonly STRONG_PATTERNS = [/\[bot\]/i] as const

  // Basic/common bot identifiers
  private static readonly COMMON_PATTERNS = [
    /(?:^|[-_/\s])(bot|robot)(?:$|[-_/\s\d])/i,
    /(?:^|[-_/\s])(actions?|agent|automation|build|deploy|hook|integration|pipeline|runner|sync)(?:$|[-_/\s\d])/i,
    /(?:^|[-_/\s])(svc|ci|cd|auto-?roll|release|merge|cron|app|service|worker|commits?)(?:$|[-_/\s\d])/i,
  ] as const

  public constructor(parentLog: Logger) {
    super(parentLog)
  }

  /** Get all text values to check (displayName + identity values) */
  private getAllTextValues(displayName: string, identities: IMemberIdentity[]): string[] {
    const values = identities.map(({ value }) => value)

    if (displayName?.trim()) {
      values.unshift(displayName.trim())
    }

    return values
  }

  /** Check if any text value matches the given patterns */
  private matchesPatterns(textValues: string[], patterns: readonly RegExp[]): boolean {
    return textValues.some((value) => patterns.some((regex) => regex.test(value)))
  }

  /** Check if any text value is a known bot */
  private hasKnownBot(textValues: string[]): boolean {
    return textValues.some((value) => isKnownBot(value))
  }

  /** Check if the member has been flagged as a bot by integration sources or users */
  public isFlaggedAsBot(attributes: Record<string, unknown>): boolean {
    return typeof attributes?.isBot === 'object' && Object.values(attributes.isBot).includes(true)
  }

  /** Check if the member is a bot or not */
  public isMemberBot(
    identities: IMemberIdentity[],
    attributes: Record<string, unknown>,
    displayName: string,
  ): MemberBotDetection {
    const textValues = this.getAllTextValues(displayName, identities)

    if (
      this.isFlaggedAsBot(attributes) ||
      this.hasKnownBot(textValues) ||
      this.matchesPatterns(textValues, BotDetectionService.STRONG_PATTERNS)
    ) {
      return MemberBotDetection.CONFIRMED_BOT
    }

    if (this.matchesPatterns(textValues, BotDetectionService.COMMON_PATTERNS)) {
      return MemberBotDetection.SUSPECTED_BOT
    }

    return MemberBotDetection.NOT_BOT
  }
}
