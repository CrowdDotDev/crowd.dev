export const tagSize = [
  'small',
  'medium',
] as const;

export type TagSize = typeof tagSize[number];
