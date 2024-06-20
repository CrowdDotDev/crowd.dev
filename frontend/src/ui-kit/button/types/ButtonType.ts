export const buttonTypes = [
  'primary',
  'secondary',
  'tertiary',
  'tertiary-gray',
  'tertiary-light-gray',
  'info',
  'info-transparent',
  'success',
  'success-transparent',
  'danger',
  'danger-transparent',
  'warning',
  'warning-transparent',
  'feature',
  'feature-transparent',
] as const;

export type ButtonType = typeof buttonTypes[number];
