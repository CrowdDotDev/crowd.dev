import { Span } from '@opentelemetry/api'

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
