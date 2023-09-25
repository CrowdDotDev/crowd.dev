import { timeout } from './timing'

/* eslint-disable @typescript-eslint/no-explicit-any */
export class RequestThrottler {
  private requests: number
  private totalRequests: number
  private interval: number
  private logger: any
  private backoff: number
  private backoffFactor: number
  private backoffStart: number
  private backoffRetries: number
  private MAX_BACKOFF_RETRIES = 4

  constructor(
    totalRequests: number,
    interval: number,
    logger: any,
    backoffStart = 1,
    backOffFactor = 2,
  ) {
    this.totalRequests = totalRequests
    this.requests = totalRequests
    this.interval = interval
    this.logger = logger
    this.backoffStart = backoffStart
    this.backoff = backoffStart
    this.backoffFactor = backOffFactor
    this.backoffRetries = 0
    setInterval(() => this.replenish(), this.interval)
  }

  private replenish(): void {
    this.requests = this.totalRequests // Replenishes requests every interval
  }

  private refreshBackoff(): void {
    this.backoff = this.backoffStart
    this.backoffRetries = 0
  }

  private advanceBackoff(): void {
    this.backoff = this.backoff * this.backoffFactor
    this.backoffRetries += 1
  }

  async throttle<T>(func: () => Promise<T>): Promise<T> {
    if (this.requests > 0) {
      this.requests--

      try {
        const value = await func()
        this.refreshBackoff()
        return value
      } catch (error) {
        this.logger.warn(`Error while executing throttling function!`)
        if (error) {
          this.logger.info(
            `Starting exponential backoff with: ${this.backoff} seconds and factor: ${this.backoffFactor}!`,
          )

          if (this.backoffRetries < this.MAX_BACKOFF_RETRIES) {
            await timeout(this.backoff)
            this.advanceBackoff()
            return this.throttle(func)
          } else {
            this.logger.warn(
              `Request failed to resolve after ${this.MAX_BACKOFF_RETRIES} exponential backoff retries!`,
            )
          }
          throw error
        }
      }
    } else {
      // Delay by the replenishment interval if out of requests
      this.logger.debug(
        `Throttling api requests limit ${this.totalRequests}, waiting ${this.interval}ms`,
      )
      await new Promise((resolve) => setTimeout(resolve, this.interval))
      return this.throttle(func)
    }
  }
}
