function isInvalid(results: any, key: string) {
  if (results.value) {
    return !(key in results.value)
  }
  if (results.error) {
    throw results.error
  }
  return true
}

export default isInvalid
