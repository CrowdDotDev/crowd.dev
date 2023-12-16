import * as proto from '@temporalio/proto'

export type Payload = proto.temporal.api.common.v1.IPayload

export interface JSONPayload {
  metadata?: Record<string, string> | null
  data?: string | null
}

export interface Body {
  payloads: JSONPayload[]
}
