export const withHttp = (url) => {
  return !/^https?:\/\//i.test(url) ? `http://${url}` : url
}
