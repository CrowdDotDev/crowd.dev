export interface EmailSent {
  sentAt: Date
}

export interface EmailToSend {
  sendTo: string[]
  link: string | null
}
