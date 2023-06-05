type RemapT = { [index: string]: any }

export const renameKeys = <T extends RemapT>(obj: RemapT, fieldMap: RemapT): T =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...{ [fieldMap[key] || key]: obj[key] },
    }),
    {} as T,
  )
