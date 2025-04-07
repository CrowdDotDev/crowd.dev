export const checkboxSizes = [
  'tiny',
  'small',
  'medium',
  'large',
] as const;

export type CheckboxSize = typeof checkboxSizes[number];
