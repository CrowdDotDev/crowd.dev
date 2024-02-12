export const switchSizes = [
  'small',
  'medium',
] as const;

export type SwitchSize = typeof switchSizes[number];
