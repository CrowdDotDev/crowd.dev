export const isObject = (val: unknown): boolean => {
  return val !== null && typeof val === 'object'
}

export const isNullOrUndefined = (val: unknown): boolean => {
  return val === null || val === undefined
}
