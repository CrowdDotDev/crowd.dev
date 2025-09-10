import { isKnownBot } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberIdentity, MemberBotDetection } from '@crowd/types'

export class BotDetectionService extends LoggerBase {
  private static readonly STRONG_PATTERNS = [
    // explicit "[bot]" notation
    /\[bot\]/i,
  ] as const

  private static readonly COMMON_PATTERNS = [
    // bot-like identifiers
    /(?:^|[-_/\s])(bot|robot)(?:$|[-_/\s])/i,

    // automation/service conventions
    /(?:^|[-_/\s])(actions?|agent|automation|build|deploy|hook|integration|pipeline|runner|sync|svc|ci|cd|auto-?roll|release|merge)(?:$|[-_/\s])/i,

    // provider automation accounts
    /(?:^|[-_/])(github|gitlab|bitbucket|azure|aws|gcp)[-_](bot|ci|actions?|pipeline|runner|automation)(?:$|[-_/])/i,

    // service/system account naming
    /^(service|system|automation|deploy|ci|build|release)[-_]?(account|bot|user)?$/i,

    // org/project prefixes + automation marker (prevents false positives on plain names)
    /(?:^|[-_/])(k8s|knative|istio|openshift|okd|cncf|lf|linuxfoundation|redhat|ibm|intel|nvidia|tensorflow|pytorch|onnx|react|angular|vue|svelte|rust|go|python|java|flutter)[-_](bot|ci|actions?|pipeline|runner|automation)(?:$|[-_/])/i,

    // numbered automation patterns (ci2, bot123, automation555)
    /(?:^|[-_/])(bot|automation|ci|cd|deploy|build|release)[-_]?\d+$/i,

    // environment-based automation (dev-service, prod-bot, staging-automation)
    /(?:^|[-_/])(dev|prod|staging|test|qa|canary)[-_](service|automation|bot|account)$/i,
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
  private isKnownBot(textValues: string[]): boolean {
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
      this.isKnownBot(textValues) ||
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
