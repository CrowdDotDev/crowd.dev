export const checkboxSizes = [
  'tiny',
  'small',
  'medium',
] as const;

export type CheckboxSize = typeof checkboxSizes[number];
