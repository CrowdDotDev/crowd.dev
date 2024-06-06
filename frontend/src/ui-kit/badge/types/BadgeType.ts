export const badgeType = [
  'primary',
  'secondary',
  'tertiary',
] as const;

export type BadgeType = typeof badgeType[number];
