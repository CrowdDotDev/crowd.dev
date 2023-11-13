export interface ISentimentClientConfig {
  region: string
  host?: string
  port?: string
  accessKeyId: string
  secretAccessKey: string
  huggingfaceApiKey: string
}

export interface ISentimentAnalysisResult {
  sentiment: number
  label: string
  positive: number
  negative: number
  neutral: number
  mixed: number
}
