export const radioSizes = [
  'small',
  'medium',
] as const;

export type RadioSize = typeof radioSizes[number];
