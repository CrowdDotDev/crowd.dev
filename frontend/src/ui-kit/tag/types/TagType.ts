export const tagTypes = [
  'primary',
  'secondary',
  'success',
  'warning',
  'danger',
] as const;

export type TagType = (typeof tagTypes)[number];
