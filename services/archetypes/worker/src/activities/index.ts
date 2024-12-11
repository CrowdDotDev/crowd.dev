import telemetry from '@crowd/telemetry'

async function telemetryIncrement(
  name: string,
  value: number,
  tags?: Record<string, string | number>,
) {
  telemetry.increment(name, value, tags)
}

async function telemetryDecrement(
  name: string,
  value: number,
  tags?: Record<string, string | number>,
) {
  telemetry.decrement(name, value, tags)
}

async function telemetryDistribution(
  name: string,
  value: number,
  tags?: Record<string, string | number>,
) {
  telemetry.distribution(name, value, tags)
}

export { telemetryIncrement, telemetryDecrement, telemetryDistribution }
