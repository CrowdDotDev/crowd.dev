export type NodeMicroserviceMessage = {
  service: string
  tenant?: string
}

export type BaseOutput = { status: number; msg?: string }

export interface AnalyticsEmailsOutput extends BaseOutput {
  emailSent: boolean
}
