import telemetry from '@crowd/telemetry'

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

export { telemetryDistribution, telemetryIncrement }
