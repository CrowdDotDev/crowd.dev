export const badgeType = [
  'default',
  'white',
  'primary',
] as const;

export type BadgeType = typeof badgeType[number];
