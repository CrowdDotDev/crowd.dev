export const checkboxSizes = [
  'small',
  'medium',
  'large',
] as const;

export type CheckboxSize = typeof checkboxSizes[number];
