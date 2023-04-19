import { v4 as uuidv4, v1 as uuidv1 } from 'uuid'

export const generateUUIDv4 = (): string => uuidv4()

export const generateUUIDv1 = (): string => uuidv1()
