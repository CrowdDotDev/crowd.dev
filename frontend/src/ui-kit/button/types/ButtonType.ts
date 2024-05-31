export const buttonTypes = [
  'primary',
  'secondary',
  'primary-ghost',
  'secondary-ghost',
  'secondary-ghost-light',
  'primary-link',
  'secondary-link',
] as const;

export type ButtonType = typeof buttonTypes[number];
