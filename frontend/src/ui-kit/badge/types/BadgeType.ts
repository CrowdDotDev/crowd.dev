export const badgeType = [
  'default',
  'white',
  'brand',
] as const;

export type BadgeType = typeof badgeType[number];
