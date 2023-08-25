export const trimUtf8ToMaxByteLength = (utf8Str: string, maxByteLength: number): string => {
  if (utf8Str === null) {
    return null
  }

  if (utf8Str === undefined) {
    return undefined
  }

  if (Buffer.byteLength(utf8Str, 'utf8') > maxByteLength) {
    // this will get us close but some characters could be multibyte encoded so we might need to trim a bit more
    utf8Str = utf8Str.slice(0, maxByteLength)
  }

  // trim till we get to the requested byte length or lower (if we cut multibyte character)
  let byteLength = Buffer.byteLength(utf8Str, 'utf8')
  while (byteLength > maxByteLength) {
    utf8Str = utf8Str.slice(0, -1)
    byteLength = Buffer.byteLength(utf8Str, 'utf8')
  }

  return utf8Str
}
