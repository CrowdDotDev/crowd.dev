export class OnboardingConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OnboardingConfigurationError'
  }
}
