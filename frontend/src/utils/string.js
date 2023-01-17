export const withHttp = (url) => {
  return !/^https?:\/\//i.test(url) ? `https://${url}` : url
}
