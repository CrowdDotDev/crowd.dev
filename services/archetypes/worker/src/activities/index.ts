import { getServiceChildLogger } from '@crowd/logging'
import telemetry from '@crowd/telemetry'

const log = getServiceChildLogger('activity-interceptor')

async function telemetryDistribution(
  name: string,
  value: number,
  tags?: Record<string, string | number>,
) {
  telemetry.distribution(name, value, tags)
}

async function telemetryIncrement(
  name: string,
  value: number,
  tags?: Record<string, string | number>,
) {
  telemetry.increment(name, value, tags)
}

async function slackNotify(message: string) {
  log.warn({ slackNotify: true }, message)
}

export { telemetryDistribution, telemetryIncrement, slackNotify }
