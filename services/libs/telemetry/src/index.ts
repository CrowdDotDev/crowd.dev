import ddTrace from 'dd-trace'

import { getServiceLogger } from '@crowd/logging'

const logger = getServiceLogger()

const empty = () => {} // eslint-disable-line @typescript-eslint/no-empty-function

function init() {
  const enabled = process.env['CROWD_DATADOG_ENABLED'] === 'true'
  if (!enabled) {
    logger.info('datadog disabled')
    return {
      dogstatsd: {
        increment: empty,
        decrement: empty,
        gauge: empty,
        distribution: empty,
        flush: empty,
      },
    }
  }

  const hostname = process.env['KUBE_HOST_IP'] || 'datadog_agent'
  logger.info('datadog enabled on', hostname)
  return ddTrace.init({
    hostname,
    startupLogs: true,
    logger: {
      debug: logger.info.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
    },
    dogstatsd: {
      hostname,
    },
    profiling: false,
    ingestion: {
      sampleRate: 0,
    },
  })
}

const datadog = init()

function prefixName(name: string) {
  return `crowd.${name}`
}

// Normalize metric names to follow Datadog conventions
function normalizeMetricName(name: string): string {
  return name.replace(/-/g, '_')
}

// Normalize tags to follow Datadog conventions
function normalizeTags(
  tags?: Record<string, string | number>,
): Record<string, string | number> | undefined {
  if (!tags) return tags

  const normalizedTags: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(tags)) {
    normalizedTags[normalizeMetricName(key)] = value
  }
  return normalizedTags
}

const telemetry = {
  gauge: (name: string, value: number, tags?: Record<string, string | number>) => {
    const finalName = prefixName(normalizeMetricName(name))
    const finalTags = normalizeTags(tags)

    try {
      datadog.dogstatsd.gauge(finalName, value, finalTags)
      logger.debug(`Sent gauge metric: ${finalName} = ${value}`, { tags: finalTags })
    } catch (error) {
      logger.error(error, `Failed to send gauge metric: ${finalName} = ${value}`, {
        tags: finalTags,
      })
    }
  },
  distribution: (name: string, value: number, tags?: Record<string, string | number>) => {
    const finalName = prefixName(normalizeMetricName(name))
    const finalTags = normalizeTags(tags)

    try {
      // milliseconds
      datadog.dogstatsd.distribution(finalName, value, finalTags)
      logger.debug(`Sent distribution metric: ${finalName} = ${value}`, { tags: finalTags })
    } catch (error) {
      logger.error(error, `Failed to send distribution metric: ${finalName} = ${value}`, {
        tags: finalTags,
      })
    }
  },
  flush: () => {
    try {
      datadog.dogstatsd.flush()
      logger.debug('Flushed dogstatsd metrics')
    } catch (error) {
      logger.error(error, 'Failed to flush dogstatsd metrics')
    }
  },
  increment: (name: string, value: number, tags?: Record<string, string | number>) => {
    const finalName = prefixName(normalizeMetricName(name))
    const finalTags = normalizeTags(tags)

    try {
      datadog.dogstatsd.increment(finalName, value, finalTags)
      logger.debug(`Sent increment metric: ${finalName} = ${value}`, { tags: finalTags })
    } catch (error) {
      logger.error(error, `Failed to send increment metric: ${finalName} = ${value}`, {
        tags: finalTags,
      })
    }
  },
  decrement: (name: string, value: number, tags?: Record<string, string | number>) => {
    const finalName = prefixName(normalizeMetricName(name))
    const finalTags = normalizeTags(tags)

    try {
      datadog.dogstatsd.decrement(finalName, value, finalTags)
      logger.debug(`Sent decrement metric: ${finalName} = ${value}`, { tags: finalTags })
    } catch (error) {
      logger.error(error, `Failed to send decrement metric: ${finalName} = ${value}`, {
        tags: finalTags,
      })
    }
  },
  timer: (name: string, tags?: Record<string, string | number>) => {
    const start = process.hrtime()
    return {
      stop: (extraTags?: Record<string, string | number>): number => {
        const diff = process.hrtime(start)
        const duration = diff[0] * 1e3 + diff[1] * 1e-6
        telemetry.distribution(name, duration, {
          ...tags,
          ...extraTags,
        })

        return duration
      },
    }
  },
  measure: async <T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string | number>,
  ) => {
    const timer = telemetry.timer(`${name}`, tags)
    try {
      const result = await fn()
      timer.stop({ success: 'true' })
      return result
    } catch (error) {
      timer.stop({ success: 'false' })
      throw error
    }
  },
}

export function normalizeUrl(url: string) {
  let result

  // replace uuids with placeholders
  result = url.replace(/[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}/g, ':id')
  // remove query string
  result = result.replace(/\?.*$/, '')

  return result
}

export function telemetryExpressMiddleware(name) {
  return (req, res, next) => {
    const timer = telemetry.timer(name, {
      method: req.method,
      url: normalizeUrl(req.url),
    })
    res.on('finish', () => {
      timer.stop({
        status: res.statusCode,
      })
    })
    next()
  }
}

export default telemetry
