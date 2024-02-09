export const checkboxSizes = [
  'small',
  'medium',
] as const;

export type CheckboxSize = typeof checkboxSizes[number];
