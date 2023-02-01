export const withHttp = (url) => {
  return !/^https?:\/\//i.test(url) ? `https://${url}` : url
}

export const toSentenceCase = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
