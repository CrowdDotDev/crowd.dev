export const buttonSizes = [
  'tiny',
  'small',
  'medium',
  'large',
] as const;

export type ButtonSize = typeof buttonSizes[number];
