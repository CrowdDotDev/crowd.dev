export const buttonTypes = [
  'primary',
  'danger',
  'secondary',
  'secondary-gray',
  'bordered',
  'primary-ghost',
  'secondary-ghost',
  'secondary-ghost-light',
  'primary-link',
  'secondary-link',
] as const;

export type ButtonType = typeof buttonTypes[number];
