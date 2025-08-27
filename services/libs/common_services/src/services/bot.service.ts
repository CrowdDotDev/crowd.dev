import { isKnownBot } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberIdentity, MemberBotDetection } from '@crowd/types'

export class BotDetectionService extends LoggerBase {
  private static readonly STRONG_PATTERNS = [
    // explicit "[bot]" notation
    /\[bot\]/i,

    // exact known bot-only accounts (strong signal)
    /^(dependa|renovate|coderabbit|codecov|deepsource|gitguardian|whitesource|mergify|snyk|copilot)$/i,

    // automation suffixes/prefixes with optional bot/robot
    /(?:^|[-_/])(ci|cd|auto-?roll|build|deploy|release|merge)(?:[-_/](bot|robot))?(?:$|[-_/])/i,

    // provider/org prefix + automation marker
    /(?:^|[-_/])(github|gitlab|bitbucket|azure|aws|gcp|k8s|openshift)(?:[-_/](bot|ci|actions?|pipeline|runner))(?:$|[-_/])/i,
  ] as const

  private static readonly COMMON_PATTERNS = [
    // bot-like identifiers
    /(?:^|[-_/])(bot|robot)(?:$|[-_/])/i,

    // automation/service terms (actions, ci, cd, etc.)
    /(?:^|[-_/])(actions?|agent|automation|build|deploy|hook|integration|pipeline|runner|sync|svc|ci|cd)(?:$|[-_/])/i,

    // org/project style prefixes
    /(?:^|[-_/])(k8s|knative|istio|openshift|okd|azure|aws|gcp|google|cncf|lf|linuxfoundation|microsoft|redhat|ibm)(?:$|[-_/])/i,
    /(?:^|[-_/])(intel|nvidia|github|gitlab|bitbucket|tensorflow|pytorch|onnx|react|angular|vue|svelte|rust|go|python|java|flutter)(?:$|[-_/])/i,
  ] as const

  public constructor(parentLog: Logger) {
    super(parentLog)
  }

  /** Identity matches a strong bot pattern */
  private hasStrongBotIndicators(identities: IMemberIdentity[]): boolean {
    return identities.some(({ value }) =>
      BotDetectionService.STRONG_PATTERNS.some((regex) => regex.test(value)),
    )
  }

  /** Identity matches a common (weak) bot pattern */
  private hasCommonBotIndicators(identities: IMemberIdentity[]): boolean {
    return identities.some(({ value }) =>
      BotDetectionService.COMMON_PATTERNS.some((regex) => regex.test(value)),
    )
  }

  /** Check if any identity matches a known bot in our dataset */
  private isKnownBotIdentity(identities: IMemberIdentity[]): boolean {
    return identities.some(({ value }) => isKnownBot(value))
  }

  /** Check if the member has been flagged as a bot by integration sources or users */
  public isFlaggedAsBot(attributes: Record<string, unknown>): boolean {
    return typeof attributes?.isBot === 'object' && Object.values(attributes.isBot).includes(true)
  }

  /** Check if the member is a bot or not */
  public isMemberBot(
    identities: IMemberIdentity[],
    attributes: Record<string, unknown>,
  ): MemberBotDetection {
    if (
      this.isFlaggedAsBot(attributes) ||
      this.isKnownBotIdentity(identities) ||
      this.hasStrongBotIndicators(identities)
    ) {
      return MemberBotDetection.CONFIRMED_BOT
    }

    if (this.hasCommonBotIndicators(identities)) {
      return MemberBotDetection.SUSPECTED_BOT
    }

    return MemberBotDetection.NOT_BOT
  }
}
