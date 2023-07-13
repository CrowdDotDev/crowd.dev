import { IIntegrationContext } from '..'

export class RequestThrottler {
  private requests: number
  private totalRequests: number
  private interval: number
  private ctx: IIntegrationContext

  constructor(totalRequests: number, interval: number, ctx: IIntegrationContext) {
    this.totalRequests = totalRequests
    this.requests = totalRequests
    this.interval = interval
    this.ctx = ctx
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
      this.ctx.log.debug(
        `Throttling api requests limit ${this.totalRequests}, waiting ${this.interval}ms`,
      )
      await new Promise((resolve) => setTimeout(resolve, this.interval))
      return this.throttle(func)
    }
  }
}
