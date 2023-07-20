export class RequestThrottler {
  private requests: number
  private totalRequests: number
  private interval: number
  private logger: any

  constructor(totalRequests: number, interval: number, logger: any) {
    this.totalRequests = totalRequests
    this.requests = totalRequests
    this.interval = interval
    this.logger = logger
    setInterval(() => this.replenish(), this.interval)
  }

  private replenish() {
    this.requests = this.totalRequests // Replenishes requests every interval
  }

  async throttle<T>(func: () => Promise<T>): Promise<T> {
    if (this.requests > 0) {
      this.requests--
      return await func()
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
