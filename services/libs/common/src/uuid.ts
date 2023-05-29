import { v4 as uuidv4, v1 as uuidv1 } from 'uuid'

export const generateUUIDv4 = (): string => uuidv4()

export const generateUUIDv1 = (): string => uuidv1()

export const validateUUID = (uuid: string): boolean => {
  const uuidRegExp = new RegExp(
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
  )

  return uuidRegExp.test(uuid)
}
