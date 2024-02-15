export const fieldMessageTypes = [
  'error',
  'warning',
  'hint',
  'info',
] as const;

export type FieldMessageType = typeof fieldMessageTypes[number];
