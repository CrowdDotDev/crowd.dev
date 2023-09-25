import { Span } from '@opentelemetry/api'

/**
 * Small utility to manually add trace details to a log: "trace_id" and "span_id".
 * Most of the time this is not required since correlation between logs and traces
 * is fully automated, but it may be useful in some rare edge cases.
 */
export const addTraceToLogFields = (
  span: Span,
  fields?: Record<string, unknown>,
): Record<string, unknown> => {
  let merged: Record<string, unknown> = {}
  if (fields) {
    merged = Object.assign({}, fields)
  }

  if (span) {
    merged['trace_id'] = span.spanContext().traceId
    merged['span_id'] = span.spanContext().spanId
  }

  return merged
}
