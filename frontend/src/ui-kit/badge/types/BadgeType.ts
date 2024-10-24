export const badgeType = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'warning',
] as const;

export type BadgeType = typeof badgeType[number];
