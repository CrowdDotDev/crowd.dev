function safeDelete(value: any, key: string) {
  if (value[key] !== undefined) {
    delete value[key]
  }
}

export const cleanSuperfaceError = (err: any): any => {
  if (err.metadata === undefined) return err
  const keys = Object.keys(err.metadata)

  for (const key of keys) {
    const value = err.metadata[key]
    switch (key) {
      case 'node':
        safeDelete(value, 'source')
        safeDelete(value, 'sourceMap')
        safeDelete(value, 'location')
        break
      case 'ast':
        safeDelete(value, 'location')
        safeDelete(value, 'astMetadata')
        if (value.header) {
          safeDelete(value.header, 'location')
          if (value.header.profile) {
            safeDelete(value.header.profile, 'version')
          }
        }
        safeDelete(value, 'definitions')
        break
      default:
        break
    }
  }

  return err
}
