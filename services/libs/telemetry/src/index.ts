import { getServiceLogger } from '@crowd/logging'
import ddTrace from 'dd-trace'

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

const telemetry = {
  gauge: (name: string, value: number, tags?: Record<string, string | number>) => {
    datadog.dogstatsd.gauge(prefixName(name), value, tags)
  },
  distribution: (name: string, value: number, tags?: Record<string, string | number>) => {
    datadog.dogstatsd.distribution(prefixName(name), value, tags)
  },
  flush: () => {
    datadog.dogstatsd.flush()
  },
  increment: (name: string, value: number, tags?: Record<string, string | number>) => {
    datadog.dogstatsd.increment(prefixName(name), value, tags)
  },
  decrement: (name: string, value: number, tags?: Record<string, string | number>) => {
    datadog.dogstatsd.decrement(prefixName(name), value, tags)
  },
  timer: (name: string, tags?: Record<string, string | number>) => {
    const start = process.hrtime()
    return {
      stop: (extraTags?: Record<string, string | number>) => {
        const diff = process.hrtime(start)
        const duration = diff[0] * 1e3 + diff[1] * 1e-6
        telemetry.distribution(name, duration, {
          ...tags,
          ...extraTags,
        })
      },
    }
  },
  measure: async (
    name: string,
    fn: () => Promise<void>,
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
  result = url.replace(/\/[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}\//g, '/:id/')
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
