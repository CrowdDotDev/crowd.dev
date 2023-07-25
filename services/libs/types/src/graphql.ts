export type GraphQlQueryResponse = {
  hasPreviousPage: boolean
  startCursor: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
}
