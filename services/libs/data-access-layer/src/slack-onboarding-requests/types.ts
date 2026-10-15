export interface ISlackOnboardingRequestButton {
  text: string
  url: string
}

export interface ISlackOnboardingRequestHeader {
  lines: string[]
  buttons: ISlackOnboardingRequestButton[]
  alreadyTracked: number
}

export interface IDbSlackOnboardingRequest {
  sourceUrl: string
  channel: string
  messageTs: string
  header: ISlackOnboardingRequestHeader
  doneNotifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type IDbSlackOnboardingRequestCreate = Pick<
  IDbSlackOnboardingRequest,
  'sourceUrl' | 'channel' | 'messageTs' | 'header'
>
